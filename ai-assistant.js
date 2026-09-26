/* Blue Chain Aqua - multilingual text + voice AI assistant.
   Local test mode: config.js contains the Groq key. Move the key server-side before production.
*/
(function () {
  'use strict';

  function init() {
    var root = document.getElementById('bcaAi');
    var launch = document.getElementById('bcaAiLaunch');
    var panel = document.getElementById('bcaAiPanel');
    var close = document.getElementById('bcaAiClose');
    var form = document.getElementById('bcaAiForm');
    var input = document.getElementById('bcaAiInput');
    var send = document.getElementById('bcaAiSend');
    var mic = document.getElementById('bcaAiMic');
    var language = document.getElementById('bcaAiLanguage');
    var voiceToggle = document.getElementById('bcaAiVoiceToggle');
    var voiceStatus = document.getElementById('bcaAiVoiceStatus');
    var messages = document.getElementById('bcaAiMessages');
    var suggestions = document.getElementById('bcaAiSuggestions');

    if (!root || !launch || !panel || !close || !form || !input || !send || !mic || !language || !messages) return;

    var history = [];
    var busy = false;
    var recording = false;
    var mediaRecorder = null;
    var audioChunks = [];
    var voiceOutput = true;
    var currentAudio = null;

    var localized = {
      English: {
        placeholder: 'Ask an aquaculture question...',
        changed: 'Answer language is now English. You can speak in English, Telugu or Hindi.',
        error: 'Sorry, I could not process that question. Please check your API key and internet connection, then try again.',
        listening: '🎙️ Listening… speak your question now.',
        transcribing: '⌛ Converting your voice to text…',
        micError: 'Microphone access was not available. Please allow microphone permission in Chrome.',
        noSpeech: 'I could not hear a clear question. Please try again.',
        voiceOn: '🔊 Voice On',
        voiceOff: '🔇 Voice Off'
      },
      Telugu: {
        placeholder: 'ఆక్వాకల్చర్ గురించి మీ ప్రశ్న అడగండి...',
        changed: 'సమాధాన భాష ఇప్పుడు తెలుగు. మీరు తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో మాట్లాడవచ్చు.',
        error: 'క్షమించండి, మీ ప్రశ్నను ప్రాసెస్ చేయలేకపోయాను. API కీ మరియు ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
        listening: '🎙️ వింటున్నాను… మీ ప్రశ్నను ఇప్పుడు మాట్లాడండి.',
        transcribing: '⌛ మీ మాటలను టెక్స్ట్‌గా మార్చుతున్నాను…',
        micError: 'మైక్రోఫోన్ యాక్సెస్ అందుబాటులో లేదు. Chromeలో మైక్రోఫోన్ అనుమతిని ఇవ్వండి.',
        noSpeech: 'మీ ప్రశ్న స్పష్టంగా వినిపించలేదు. మళ్లీ ప్రయత్నించండి.',
        voiceOn: '🔊 వాయిస్ ఆన్',
        voiceOff: '🔇 వాయిస్ ఆఫ్'
      },
      Hindi: {
        placeholder: 'एक्वाकल्चर से जुड़ा प्रश्न पूछें...',
        changed: 'उत्तर की भाषा अब हिन्दी है। आप हिन्दी, तेलुगु या अंग्रेज़ी में बोल सकते हैं।',
        error: 'क्षमा करें, आपका प्रश्न प्रोसेस नहीं हो सका। API key और इंटरनेट कनेक्शन जांचकर फिर प्रयास करें।',
        listening: '🎙️ सुन रहा हूँ… अब अपना प्रश्न बोलें।',
        transcribing: '⌛ आपकी आवाज़ को टेक्स्ट में बदल रहा हूँ…',
        micError: 'माइक्रोफ़ोन उपलब्ध नहीं है। Chrome में माइक्रोफ़ोन की अनुमति दें।',
        noSpeech: 'आपका प्रश्न स्पष्ट रूप से सुनाई नहीं दिया। फिर से प्रयास करें।',
        voiceOn: '🔊 आवाज़ चालू',
        voiceOff: '🔇 आवाज़ बंद'
      }
    };

    function selectedLangCode() {
      return language.value === 'Telugu' ? 'te-IN' : language.value === 'Hindi' ? 'hi-IN' : 'en-IN';
    }

    function openPanel() {
      panel.hidden = false;
      panel.removeAttribute('hidden');
      panel.style.display = 'flex';
      launch.setAttribute('aria-expanded', 'true');
      setTimeout(function () { input.focus(); }, 50);
    }

    function closePanel() {
      stopRecording();
      panel.hidden = true;
      panel.setAttribute('hidden', '');
      panel.style.display = 'none';
      launch.setAttribute('aria-expanded', 'false');
    }

    function addMessage(role, text, extra) {
      var wrap = document.createElement('div');
      wrap.className = 'bca-ai-message ' + role;
      var bubble = document.createElement('div');
      bubble.className = 'bca-ai-bubble' + (extra ? ' ' + extra : '');
      bubble.textContent = text;
      wrap.appendChild(bubble);

      if (role === 'bot' && text && extra !== 'typing') {
        var speakBtn = document.createElement('button');
        speakBtn.type = 'button';
        speakBtn.className = 'bca-ai-speak-message';
        speakBtn.textContent = '🔊';
        speakBtn.title = 'Read this answer aloud';
        speakBtn.setAttribute('aria-label', 'Read this answer aloud');
        speakBtn.addEventListener('click', function () { speakText(text); });
        wrap.appendChild(speakBtn);
      }

      messages.appendChild(wrap);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }

    function setVoiceStatus(text) {
      if (voiceStatus) voiceStatus.textContent = text;
    }

    function speakText(text) {
      if (!('speechSynthesis' in window) || !text) return;
      try {
        window.speechSynthesis.cancel();
        var utter = new SpeechSynthesisUtterance(text);
        utter.lang = selectedLangCode();
        utter.rate = 0.96;
        utter.pitch = 1;
        var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
        var prefix = utter.lang.toLowerCase().split('-')[0];
        var match = voices.find(function (v) {
          return (v.lang || '').toLowerCase().startsWith(prefix);
        });
        if (match) utter.voice = match;
        window.speechSynthesis.speak(utter);
      } catch (e) {
        console.warn('Speech synthesis unavailable:', e);
      }
    }

    function updateVoiceToggle() {
      if (!voiceToggle) return;
      voiceToggle.textContent = voiceOutput ? localized[language.value].voiceOn : localized[language.value].voiceOff;
      voiceToggle.setAttribute('aria-pressed', voiceOutput ? 'true' : 'false');
    }

    async function transcribeBlob(blob) {
      var sttModel = String((window.BCA_CONFIG || {}).GROQ_STT_MODEL || 'whisper-large-v3-turbo').trim();

      var extension = (blob.type || '').includes('mp4') ? 'mp4' : 'webm';
      var file = new File([blob], 'bca-question.' + extension, { type: blob.type || 'audio/webm' });
      var fd = new FormData();
      fd.append('file', file);
      fd.append('model', sttModel);
      fd.append('response_format', 'json');
      fd.append('temperature', '0');

      var res = await fetch('/api/transcribe', {
        method: 'POST',
        body: fd
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || ('Speech-to-text HTTP ' + res.status));
      return String(data.text || '').trim();
    }

    async function startRecording() {
      if (recording || busy) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        setVoiceStatus('Voice input is not supported by this browser. Please use Chrome or Edge.');
        return;
      }

      try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        var preferred = 'audio/webm;codecs=opus';
        var mime = MediaRecorder.isTypeSupported(preferred) ? preferred : 'audio/webm';
        mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
        audioChunks = [];
        recording = true;
        mic.classList.add('recording');
        mic.textContent = '⏹️';
        mic.setAttribute('aria-label', 'Stop recording');
        setVoiceStatus(localized[language.value].listening);

        mediaRecorder.ondataavailable = function (event) {
          if (event.data && event.data.size) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async function () {
          stream.getTracks().forEach(function (track) { track.stop(); });
          recording = false;
          mic.classList.remove('recording');
          mic.textContent = '🎙️';
          mic.setAttribute('aria-label', 'Speak your question');
          if (!audioChunks.length) {
            setVoiceStatus(localized[language.value].noSpeech);
            return;
          }
          var blob = new Blob(audioChunks, { type: mime });
          audioChunks = [];
          setVoiceStatus(localized[language.value].transcribing);
          try {
            var transcript = await transcribeBlob(blob);
            if (!transcript) throw new Error('empty');
            input.value = transcript;
            setVoiceStatus('✓ ' + transcript);
            ask(transcript);
          } catch (err) {
            console.error('Speech transcription error:', err);
            setVoiceStatus(localized[language.value].micError + ' ' + (err.message || ''));
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error('Microphone error:', err);
        setVoiceStatus(localized[language.value].micError);
      }
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }

    async function ask(question) {
      var text = String(question || '').trim();
      if (!text || busy) return;

      var cfg = window.BCA_CONFIG || {};
      var model = String(cfg.GROQ_MODEL || 'openai/gpt-oss-120b').trim();

      busy = true;
      send.disabled = true;
      mic.disabled = true;
      input.disabled = true;
      addMessage('user', text);
      var typing = addMessage('bot', 'Thinking…', 'typing');

      var selectedLanguage = language.value;
      var languageName = selectedLanguage === 'Telugu' ? 'Telugu' : selectedLanguage === 'Hindi' ? 'Hindi' : 'English';

      var systemPrompt = [
        'You are Blue Chain Aqua AI, the dedicated AI assistant for Blue Chain Aqua, an Aquaculture & Fisheries Consultancy in India.',
        '',
        'STRICT SCOPE: Answer aquaculture AND fisheries questions. Fisheries is explicitly in scope, including capture fisheries, inland fisheries, marine fisheries, fish production, fishing activities, fish landing, cold chain, fish processing, fisheries infrastructure, fisher welfare, fisheries schemes, government programmes, fisheries finance, and aquaculture.',
        'IN-SCOPE EXAMPLES THAT MUST BE ANSWERED: FIDF (Fisheries and Aquaculture Infrastructure Development Fund), PMMSY, KCC for fisheries, fisheries subsidies, fish farming, shrimp farming, hatcheries, biofloc, RAS, ponds, cages, water quality, feed, disease prevention, stocking, nursery, grow-out, harvesting, processing, cold storage, ice plants, fishing boats, fisheries infrastructure, DPRs, project finance, scheme eligibility, documentation, and Blue Chain Aqua services/projects.',
        'IMPORTANT: A question containing words such as fish, fisheries, fisher, fishing, shrimp, prawn, aquaculture, FIDF, PMMSY, hatchery, pond, biofloc, RAS, feed, fish disease, fish processing, cold storage, fisheries scheme or fisheries subsidy is an aquaculture/fisheries question and MUST NOT be refused as unrelated.',
        'If the user asks anything genuinely unrelated to aquaculture or fisheries, politely refuse and say that you only handle aquaculture and fisheries topics. Do not refuse a fisheries question merely because it concerns a government scheme, finance, infrastructure, fishing, processing or a fisheries-related abbreviation.',
        '',
        'IMPORTANT LANGUAGE RULE: The user may ask in English, Telugu, Hindi, or a mixture of them. ALWAYS answer ONLY in ' + languageName + ', regardless of the language used in the question. Do not switch the answer language based on the question language.',
        'If the selected answer language is Telugu, use natural Telugu script. If Hindi, use natural Devanagari script. If English, use English.',
        'Keep answers practical and clear for farmers and project owners.',
        'Do not claim to be a government authority. For project-specific technical, veterinary, chemical, legal, financial or regulatory decisions, provide general information and recommend a qualified professional where appropriate.',
        '',
        'BLUE CHAIN AQUA CONTEXT: Services include farmer onboarding, site/water assessment, scheme identification, DPR and documentation, submission/follow-up, sanction/disbursement coordination, implementation support, pond preparation, hatchery, grow-out farming, harvesting, processing/value addition, market/supply-chain planning and blue-economy projects. Known project coverage includes Andhra Pradesh, Telangana, Odisha, Kerala and West Bengal.'
      ].join('\n');

      var apiMessages = [{ role: 'system', content: systemPrompt }].concat(history.slice(-8)).concat([{ role: 'user', content: text }]);

      try {
        var res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: apiMessages,
            temperature: 0.3,
            max_completion_tokens: 900
          })
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status));
        var answer = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!answer) throw new Error('No answer returned by Groq.');
        answer = String(answer).trim();
        typing.textContent = answer;
        typing.classList.remove('typing');
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: answer });
        if (history.length > 8) history = history.slice(-8);
        if (voiceOutput) speakText(answer);
      } catch (err) {
        console.error('Blue Chain Aqua AI error:', err);
        typing.textContent = localized[selectedLanguage].error + ' (' + (err.message || 'request failed') + ')';
        typing.classList.remove('typing');
      } finally {
        busy = false;
        send.disabled = false;
        mic.disabled = false;
        input.disabled = false;
        input.focus();
        messages.scrollTop = messages.scrollHeight;
      }
    }

    launch.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      if (panel.hidden) openPanel(); else closePanel();
    });

    close.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation(); closePanel();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      ask(text);
    });

    mic.addEventListener('click', function () {
      if (recording) stopRecording(); else startRecording();
    });

    language.addEventListener('change', function () {
      input.placeholder = localized[language.value].placeholder;
      updateVoiceToggle();
      setVoiceStatus(localized[language.value].changed);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    });

    if (voiceToggle) {
      voiceToggle.addEventListener('click', function () {
        voiceOutput = !voiceOutput;
        if (!voiceOutput && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        updateVoiceToggle();
      });
    }

    if (suggestions) {
      suggestions.querySelectorAll('button').forEach(function (button) {
        button.addEventListener('click', function () {
          var q = button.getAttribute('data-question') || '';
          input.value = q;
          ask(q);
          input.value = '';
        });
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) closePanel();
    });

    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    updateVoiceToggle();
    closePanel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
