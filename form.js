// Google Apps Script Web App URL (deployed to accept POSTs)
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwgyWRCH891VUQbpWMYNrL9fKdgg35s6QH9y4v28-3a/dev';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('curiosityForm');
  const status = document.getElementById('status');

  function setStatus(msg, isError, target){
    const el = target || status;
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'crimson' : '';
  }

  function submitHiddenForm(payload){
    return new Promise((resolve) => {
      console.log('submitHiddenForm payload:', payload);
      // ensure iframe exists
      let iframe = document.getElementById('submit_frame');
      const iframeCreated = !iframe;
      if (!iframe){
        iframe = document.createElement('iframe');
        iframe.name = 'submit_frame';
        iframe.id = 'submit_frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      // create form
      const f = document.createElement('form');
      f.style.display = 'none';
      f.method = 'POST';
      f.action = FORM_ENDPOINT;
      f.target = 'submit_frame';
      f.enctype = 'application/x-www-form-urlencoded';

      // helper: add input for a specific name
      function addField(name, value){
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value ?? '';
        f.appendChild(input);
      }

      // Append only the exact fields your doPost expects
      addField('timestamp', payload.timestamp || new Date().toISOString());
      addField('name', payload.name || '');
      addField('mobile', payload.mobile || '');
      addField('email', payload.email || '');
      addField('inquiry1', payload.inquiry1 || '');
      addField('inquiry2', payload.inquiry2 || '');
      addField('inquiry3', payload.inquiry3 || '');
      addField('message', payload.message || '');

      document.body.appendChild(f);

      let resolved = false;
      function cleanup(result){
        if (resolved) return;
        resolved = true;
        try{ document.body.removeChild(f); }catch(_){ }
        // remove iframe only if we created it
        if (iframeCreated){ try{ document.body.removeChild(iframe); }catch(_){ } }
        console.log('submitHiddenForm cleanup', result);
        resolve(result);
      }

      // onload indicates the POST completed (even cross-origin). Use a timeout to guard.
      const onloadHandler = () => {
        console.log('iframe load event fired — assume submission completed');
        cleanup({ ok: true });
      };

      iframe.addEventListener('load', onloadHandler, { once: true });

      // submit and wait for load or timeout
      try{
        f.submit();
      }catch(subErr){
        console.warn('hidden form submit threw', subErr);
      }

      const timer = setTimeout(() => {
        // if onload didn't fire within 6s, assume success anyway (Apps Script often responds quickly)
        console.log('hidden form timeout — assuming success');
        cleanup({ ok: true });
      }, 6000);

      // ensure timer is cleared on cleanup
      const origCleanup = cleanup;
      cleanup = (res) => { clearTimeout(timer); iframe.removeEventListener('load', onloadHandler); origCleanup(res); };
    });
  }

  // Listen for custom event dispatched by main.js when the in-page modal form is submitted
  document.addEventListener('curiosity:submit', async (e) => {
    const { payload, form: submittedForm, statusEl } = e.detail || {};
    const statusTarget = statusEl || status;
    console.log('curiosity:submit received', payload);
    setStatus('Sending...', false, statusTarget);

    if (!payload || !payload.inquiry1){
      setStatus('Please provide Inquiry 1 (required).', true, statusTarget);
      return;
    }

    if (!FORM_ENDPOINT || FORM_ENDPOINT.includes('REPLACE_WITH')){
      setStatus('Form endpoint not configured. Please set FORM_ENDPOINT in form.js', true, statusTarget);
      return;
    }

    try {
      // Force using hidden-form fallback to avoid CORS issues.
      setStatus('Submitting via hidden form...', false, statusTarget);
      const fallbackResp = await submitHiddenForm({
        // send only the exact fields expected by doPost
        timestamp: new Date().toISOString(),
        name: payload.name || '',
        mobile: payload.mobile || '',
        email: payload.email || '',
        inquiry1: payload.inquiry1 || '',
        inquiry2: payload.inquiry2 || '',
        inquiry3: payload.inquiry3 || '',
        message: payload.message || ''
      });

      console.log('hidden form result', fallbackResp);

      if (fallbackResp && fallbackResp.ok){
        setStatus('Thanks — your curiosity has been recorded.', false, statusTarget);
        if (submittedForm && typeof submittedForm.reset === 'function') submittedForm.reset();
        const curiosityModal = document.getElementById('curiosityModal');
        if (curiosityModal) curiosityModal.setAttribute('hidden', '');
        document.body.classList.remove('no-scroll');
        return;
      }

      setStatus('Submission error — please try again later.', true, statusTarget);

    } catch (err) {
      console.error(err);
      setStatus('Submission error — please try again later.', true, statusTarget);
    }
  });


  // Backwards compatibility for standalone form.html page
  if (form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const payload = {
        timestamp: new Date().toISOString(),
        name: data.get('name') || '',
        mobile: data.get('mobile') || '',
        email: data.get('email') || '',
        inquiry1: data.get('inq1') || '',
        inquiry2: data.get('inq2') || '',
        inquiry3: data.get('inq3') || '',
        message: data.get('message') || ''
      };

      // reuse the same logic by dispatching the custom event
      document.dispatchEvent(new CustomEvent('curiosity:submit', { detail: { payload, form, statusEl: document.getElementById('status') }}));
    });
  }

});
