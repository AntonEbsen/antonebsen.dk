
  import { supabase } from '../../lib/supabase';
  const track = (name, props) => console.log('Track:', name, props);


      // Elements
      const voiceIndicator = document.getElementById('voice-indicator');
      const widget = document.getElementById('chat-widget');
      const chatWindow = document.getElementById('chat-window');
      const toggle = document.getElementById('chat-toggle');
      const close = document.getElementById('close-chat');
      const form = document.getElementById('chat-form');
      const input = document.getElementById('chat-input');
      const voiceBtn = document.getElementById('voice-btn');
      const fileInput = document.getElementById('chat-file');
      const fileBtn = document.getElementById('file-btn');
      const fileDisplay = document.getElementById('file-display');
      const fileNameSpan = document.getElementById('file-name');
      const removeFileBtn = document.getElementById('remove-file');
      const contentElement = document.getElementById('chat-content');
      const personaSelect = document.getElementById('persona-select');
      const header = document.getElementById('chat-header');
      const messages = document.getElementById('chat-messages');

      // Concierge Logic
      const currentLang = widget?.getAttribute('data-lang') || 'da';
      const currentPath = window.location.pathname; // Global window
      
      const conciergeMessages = {
          '/cv': {
              da: "Har du spÃ¸rgsmÃ¥l til min erfaring eller specifikke roller?",
              en: "Do you have questions about my experience or specific roles?"
          },
          '/portfolio': {
              da: "Jeg kan forklare teknologistakken bag disse projekter. SpÃ¸rg lÃ¸s!",
              en: "I can explain the tech stack behind these projects. Ask away!"
          },
          '/blog': {
              da: "LÃ¦ser du mine tanker? Jeg kan opsummere ethvert blogindlÃ¦g for dig.",
              en: "Reading my thoughts? I can summarize any post for you."
          },
          '/ai-project': {
              da: "Nysgerrig pÃ¥ hvordan jeg arbejder? SpÃ¸rg mig om min RAG-arkitektur!",
              en: "Curious about how I work? Ask me about my RAG architecture!"
          }
      };

      try {
          const matchedPath = Object.keys(conciergeMessages).find(path => currentPath.startsWith(path));
          
          if (matchedPath) {
             const msg = conciergeMessages[matchedPath][currentLang];
             const introText = document.querySelector('#chat-messages p');
             if (introText) {
                 introText.textContent = msg;
                 introText.parentElement.classList.add('border-accent', 'border');
             }
          }
      } catch(err) {
          console.error("Concierge Error:", err);
      }

      // UI Logic
      let isOpen = false;

      function toggleChat() {
        if (!chatWindow || !toggle) return;
        
        isOpen = !isOpen;
        if (isOpen) {
          chatWindow.classList.remove('hidden');
          setTimeout(() => {
            chatWindow.classList.remove('translate-y-10', 'opacity-0');
            toggle.classList.add('scale-0', 'opacity-0');
            toggle.style.display = 'none'; 
          }, 10);
          input?.focus();
        } else {
          chatWindow.classList.add('translate-y-10', 'opacity-0');
          toggle.style.display = 'flex';
          setTimeout(() => {
             toggle.classList.remove('scale-0', 'opacity-0');
          }, 10);
          setTimeout(() => {
            chatWindow.classList.add('hidden');
          }, 300);
        }
      }

      if (toggle) toggle.addEventListener('click', toggleChat);
      if (close) close.addEventListener('click', toggleChat);

      // File Upload Logic
      let currentFileContent = null;

      fileBtn?.addEventListener('click', () => fileInput?.click());

      fileInput?.addEventListener('change', async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          if(fileDisplay && fileNameSpan) {
              fileDisplay.classList.remove('hidden');
              fileNameSpan.textContent = "Processing..." + file.name;
          }

          try {
              let text = "";
              if (file.type === 'application/pdf') {
                  if(!window.pdfjsLib) throw new Error("PDF.js not loaded");
                  const arrayBuffer = await file.arrayBuffer();
                  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                  for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const content = await page.getTextContent();
                      text += content.items.map(item => item.str).join(' ') + "\n";
                  }
              } else {
                  text = await file.text();
              }

              currentFileContent = `\n\n<<<FILE_CONTENT Start: ${file.name}>>>\n${text}\n<<<FILE_CONTENT End>>>\n`;
              if(fileNameSpan) fileNameSpan.textContent = file.name + " (Ready)";
              
          } catch (err) {
              console.error("File read error:", err);
              if(fileNameSpan) fileNameSpan.textContent = "Error reading file";
              currentFileContent = null;
          }
      });

      removeFileBtn?.addEventListener('click', () => {
          currentFileContent = null;
          if (fileInput) fileInput.value = '';
          fileDisplay?.classList.add('hidden');
      });
      
      // Persona Logic
      const personaSelectElement = document.getElementById('widget-persona-select');
      if (personaSelectElement) {
          const savedPersona = localStorage.getItem('anton_ai_persona');
          if (savedPersona) personaSelectElement.value = savedPersona;
          
          // Personas Configuration
          const personas = {
            'default': { name: 'Standard', icon: 'fa-solid fa-robot', color: 'bg-accent/5', description: '' },
            'recruiter': { name: 'Recruiter', icon: 'fa-solid fa-briefcase', color: 'bg-blue-900/50', description: 'Focused on career.' },
            'tech': { name: 'Tech Lead', icon: 'fa-solid fa-microchip', color: 'bg-green-900/50', description: 'Technical focus.' },
            'eli5': { name: 'ELI5', icon: 'fa-solid fa-child-reaching', color: 'bg-yellow-900/50', description: 'Simple terms.' }
          };

          // Event Listeners for Persona
          personaSelectElement?.addEventListener('change', (e) => {
            const val = e.target.value;
            const p = personas[val] || personas['default'];
            
            // Update UI
            if(header) {
                header.innerHTML = `<div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-accent text-bg flex items-center justify-center"><i class="${p.icon}"></i></div><div><h3 class="font-bold text-sm">${p.name}</h3></div></div>`;
                // header.className updates... simplified for robustness
                header.classList.remove('bg-accent/5', 'bg-blue-900/50', 'bg-green-900/50', 'bg-yellow-900/50');
                header.classList.add(p.color);
            }
            
            // Add system message about switch
            addMessage(`System: Switched to ${p.name} mode. ${p.description}`, 'system', true, val);
          });
      }

      // Draggable Logic
      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;
      let xOffset = 0;
      let yOffset = 0;

      if (header && chatWindow) {
          header.addEventListener('mousedown', dragStart);
          document.addEventListener('mousemove', drag);
          document.addEventListener('mouseup', dragEnd);
          
          // Touch support
          header.addEventListener('touchstart', dragStart, {passive: false});
          document.addEventListener('touchmove', drag, {passive: false});
          document.addEventListener('touchend', dragEnd);
      }

      function dragStart(e) {
         if (e.target.closest('button') || e.target.closest('a')) return; // Allow clicking buttons in header
         
         if (e.type === "touchstart") {
             initialX = e.touches[0].clientX - xOffset;
             initialY = e.touches[0].clientY - yOffset;
         } else {
             initialX = e.clientX - xOffset;
             initialY = e.clientY - yOffset;
         }

         if (e.target === header || header.contains(e.target)) {
             isDragging = true;
             // Fix the window in place relative to viewport once dragging starts
             const rect = chatWindow.getBoundingClientRect();
             
             // Important: We need to break out of the flex container constraints
             // Switch to fixed positioning if not already
             if (chatWindow.style.position !== 'fixed') {
                 chatWindow.style.position = 'fixed';
                 chatWindow.style.left = rect.left + 'px';
                 chatWindow.style.top = rect.top + 'px';
                 chatWindow.style.marginBottom = '0';
                 chatWindow.style.transform = 'none'; // distinct from open animation
                 
                 // Recalculate offsets after switching to fixed
                 // But simply starting translate from 0,0 is easier if we track delta
                  initialX = e.clientX || e.touches[0].clientX;
                  initialY = e.clientY || e.touches[0].clientY;
                 
                 // Store current top/left
                 xOffset = rect.left;
                 yOffset = rect.top;
             }
         }
      }

      function dragEnd() {
         initialX = currentX;
         initialY = currentY;
         isDragging = false;
      }

      function drag(e) {
         if (isDragging) {
             e.preventDefault();
             
             let clientX, clientY;
             if (e.type === "touchmove") {
                 clientX = e.touches[0].clientX;
                 clientY = e.touches[0].clientY;
             } else {
                 clientX = e.clientX;
                 clientY = e.clientY;
             }

             // Calculate new position
             const dx = clientX - initialX;
             const dy = clientY - initialY;
             
             currentX = xOffset + dx;
             currentY = yOffset + dy;

             // Boundary checks (keep on screen)
             const rect = chatWindow.getBoundingClientRect();
             const viewportWidth = window.innerWidth;
             const viewportHeight = window.innerHeight;
             
             // Clamp X
             if (currentX < 0) currentX = 0;
             if (currentX + rect.width > viewportWidth) currentX = viewportWidth - rect.width;
             
             // Clamp Y
             if (currentY < 0) currentY = 0;
             if (currentY + rect.height > viewportHeight) currentY = viewportHeight - rect.height;
             
             // Update position (since we are fixed mode)
             chatWindow.style.left = currentX + 'px';
             chatWindow.style.top = currentY + 'px';
         }
      }

      // Voice Logic
      // Check if browser supports speech recognition
      let recognition;
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.lang = currentLang === 'da' ? 'da-DK' : 'en-US';
          recognition.interimResults = false;

          recognition.onstart = () => {
              if(voiceIndicator) {
                  voiceIndicator.classList.remove('opacity-0');
                  voiceIndicator.classList.add('animate-pulse', 'border-red-500');
              }
              voiceBtn?.classList.add('text-red-400');
          };

          recognition.onend = () => {
              if(voiceIndicator) {
                  voiceIndicator.classList.add('opacity-0');
                  voiceIndicator.classList.remove('animate-pulse', 'border-red-500');
              }
              voiceBtn?.classList.remove('text-red-400');
          };

          recognition.onerror = (event) => {
              console.error("ðŸŽ¤ FP Voice error:", event.error);
              if(voiceIndicator) voiceIndicator.classList.add('opacity-0');
              voiceBtn?.classList.remove('text-red-400');
              if (event.error === 'not-allowed') {
                  alert("Microphone access denied.");
              }
          };

          recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              if (input) {
                  input.value = transcript;
                  input.focus();
              }
          };

          voiceBtn?.addEventListener('click', () => {
              try {
                  recognition.start();
              } catch (e) {
                  console.log("Recognition already started or error:", e);
                  recognition.stop();
              }
          });
      } else {
          if(voiceBtn) voiceBtn.style.display = 'none';
      }

      // Quick Prompts Logic
      document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = e.currentTarget.textContent?.trim();
            if(text && input && form) {
                input.value = text;
                form.dispatchEvent(new Event('submit'));
                e.currentTarget.parentElement?.remove();
            }
        });
      });

      // Submit Logic
      if (form) {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = input?.value.trim() || "";
            if (!query && !currentFileContent) return;

            const persona = localStorage.getItem('anton_ai_persona') || 'default';

            addMessage(query || (currentFileContent ? `[Attached: ${fileInput?.files?.[0]?.name}]` : "Empty message"), 'user', false, persona);
            
            const fullPayload = query + (currentFileContent || "");
            
            if (input) input.value = '';
            
            if(currentFileContent) {
                removeFileBtn?.click();
            }

            showTyping();
                      // Send to AI
              const res = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: fullPayload, lang: currentLang, persona })
              });
              
              track('AI_Request', { length: fullPayload.length, lang: currentLang, persona: persona });
              
              removeTyping();

              if (!res.ok) {
                 const text = await res.text();
                 let errorMsg = `Server Error (${res.status})`;
                 if (text) {
                     try {
                         const data = JSON.parse(text);
                         errorMsg = data.message || errorMsg;
                     } catch (e) {
                         // Valid text but not JSON (e.g. HTML error page)
                         errorMsg += `: ${text.substring(0, 100)}...`;
                     }
                 } else {
                     errorMsg += ": Empty Response";
                 }
                 
                 addMessage("âš ï¸ " + errorMsg, 'ai', false, persona);
                 return;
              }

              const messageContent = addMessage("", 'ai', true, persona);
              const reader = res.body?.getReader();
              const decoder = new TextDecoder();
              let accumulatedText = "";

              if (reader) {
                  while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      
                      const chunk = decoder.decode(value, { stream: true });
                      accumulatedText += chunk;
                      
                      if (messageContent) {
                          messageContent.innerHTML = formatText(accumulatedText);
                      }
                      const msgs = document.getElementById('chat-messages');
                      if(msgs) msgs.scrollTop = msgs.scrollHeight;
                  }
              }

              // Save to history
              saveMessageToHistory(accumulatedText, 'ai', persona);

              if (messageContent) {
                   const wrapper = messageContent.closest('.ai-content-wrapper');
                   processSpecialTags(accumulatedText, wrapper); 
              }

            } catch (err) {
              removeTyping();
              console.error(err);
              addMessage(`âš ï¸ Connection error: ${err.message || 'Unknown'}`, 'ai');
            }
          });
      }

      // Helpers
      function formatText(text) {
          // Simple link formatting
          return text.replace(/<<<CHART[\s\S]*?CHART>>>/g, '')
                     .replace(/<<<NAVIGATE:.*?>>>/gi, '')
                     .replace(/<<<SUGGESTIONS:.*?>>>/g, '')
                     .replace(/<<<CITATION:(.*?)>>>/g, '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] uppercase tracking-wider text-accent mx-1 select-none cursor-help" title="Source: Uploaded Document"><i class="fa-solid fa-file-pdf"></i> $1</span>')
                     .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                     .replace(/\n/g, '<br/>');
      }

      function processSpecialTags(text, containerDiv) {
         if (!containerDiv) return;

         // Chart
         const chartMatch = text.match(/<<<CHART([\s\S]*?)CHART>>>/);
         if (chartMatch) {
             const jsonStr = chartMatch[1];
             try {
                 const chartData = JSON.parse(jsonStr);
                 const canvasId = 'chart-' + Date.now();
                 const canvasContainer = document.createElement('div');
                 canvasContainer.className = "mt-4 p-4 bg-[rgba(255,255,255,0.05)] rounded-xl border border-[rgba(255,255,255,0.1)]";
                 canvasContainer.innerHTML = `<canvas id="${canvasId}"></canvas>`;
                 
                 const textDiv = containerDiv.querySelector('.message-bubble') || containerDiv;
                 textDiv.appendChild(canvasContainer);
                 const msgs = document.getElementById('chat-messages');
                 if(msgs) msgs.scrollTop = msgs.scrollHeight;

                 import('chart.js/auto').then(({ default: Chart }) => {
                     const ctx = document.getElementById(canvasId);
                     if (ctx) {
                         new Chart(ctx, {
                             type: chartData.type,
                             data: chartData.data,
                             options: {
                                 ...chartData.options,
                                 color: 'rgba(255, 255, 255, 0.8)',
                                 borderColor: 'rgba(255, 255, 255, 0.2)',
                                 scale: {
                                    ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                                 },
                                 plugins: {
                                    legend: { labels: { color: 'rgba(255, 255, 255, 0.9)' } }
                                 }
                             }
                         });
                     }
                 });

             } catch (e) {
                 console.error("Chart Render Error", e);
             }
         }
         // Navigation
         const navMatch = text.match(/<<<NAVIGATE:\s*(.*?)\s*>>>/i);
         if (navMatch) {
             const rawPath = navMatch[1].trim();
             const path = rawPath.replace(/\.$/, '');
             const navDiv = document.createElement('div');
             navDiv.className = "flex items-center gap-2 text-sm text-accent mt-3 font-bold animate-pulse";
             navDiv.innerHTML = `<i class="fa-solid fa-arrow-right-long"></i> Navigating to ${path}...`;
             const bubble = containerDiv.querySelector('.message-bubble');
             if (bubble) bubble.appendChild(navDiv); 
             else containerDiv.appendChild(navDiv);
             const msgs = document.getElementById('chat-messages');
             if(msgs) msgs.scrollTop = msgs.scrollHeight;

             setTimeout(() => {
                 window.location.href = path;
             }, 500);
         }

         // Suggestions
         const suggestMatch = text.match(/<<<SUGGESTIONS:(.*?)>>>/);
         if (suggestMatch) {
              const jsonStr = suggestMatch[1];
              try {
                  const suggestions = JSON.parse(jsonStr);
                  const chipsContainer = document.createElement('div');
                  chipsContainer.className = "flex flex-wrap gap-2 mt-4 w-full";
                  
                  suggestions.forEach(s => {
                      const btn = document.createElement('button');
                      btn.className = "text-sm bg-accent/10 hover:bg-accent hover:text-bg text-accent border border-accent/20 rounded-xl px-4 py-2 transition-all duration-300 shadow-sm";
                      btn.innerText = s;
                      btn.addEventListener('click', () => {
                          if (input && form) {
                              input.value = s;
                              form.dispatchEvent(new Event('submit'));
                              chipsContainer.remove();
                          }
                      });
                      chipsContainer.appendChild(btn);
                  });
                  
                  containerDiv.appendChild(chipsContainer);
                  const msgs = document.getElementById('chat-messages');
                  if(msgs) msgs.scrollTop = msgs.scrollHeight;

              } catch (e) {
                  console.error("Suggestion Parse Error", e);
              }
         }
      }

      const STORAGE_KEY = 'anton_ai_chat_history';

      function loadHistory() {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
              try {
                  const history = JSON.parse(stored);
                  history.forEach(msg => addMessage(msg.text, msg.role, true, msg.persona));
              } catch (e) { console.error(e); }
          }
      }

      function saveMessageToHistory(text, role, persona) {
          const stored = localStorage.getItem(STORAGE_KEY);
          let history = stored ? JSON.parse(stored) : [];
          history.push({ text, role, persona, timestamp: Date.now() });
          if (history.length > 50) history = history.slice(-50);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      }

      document.getElementById('clear-widget-chat')?.addEventListener('click', () => {
         if(confirm("Clear chat history?")) {
             localStorage.removeItem(STORAGE_KEY);
             location.reload();
         }
      });

      function addMessage(text, role, skipSave = false, persona = 'default') {
        const msgs = document.getElementById('chat-messages');
        if (!msgs) return;
        
        if (!skipSave) saveMessageToHistory(text, role, persona);
        const div = document.createElement('div');
        div.className = `flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`;

        let contentElement;

        // Map personas to titles
        const titles = {
            'default': 'AI Analysis',
            'recruiter': 'ðŸ’¼ Recruiter Mode',
            'tech': 'ðŸ’» Tech Lead Mode',
            'eli5': 'ðŸ‘¶ ELI5 Mode'
        };
        const displayTitle = titles[persona] || titles['default'];

        if (role === 'ai') {
          div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-1 border border-accent/20">
              <i class="fa-solid fa-robot text-lg"></i>
            </div>
            <div class="flex flex-col max-w-[85%] ai-content-wrapper">
                <div class="bg-white/5 border border-white/10 p-5 rounded-sm border-l-2 border-l-accent leading-relaxed text-dim-100 message-bubble shadow-lg">
                  <p class="font-mono text-xs text-accent mb-2 uppercase tracking-wide flex justify-between items-center">
                    <span>${displayTitle}</span>
                    ${persona !== 'default' ? '<i class="fa-solid fa-check-circle opacity-50"></i>' : ''}
                  </p>
                  <div class="prose prose-invert max-w-none text-sm md:text-base font-light">
                    ${formatText(text)}
                  </div>
                </div>
                
                <div class="flex gap-2 mt-2 ml-1">
                   ${text ? `
                   <button class="text-xs text-dim hover:text-accent transition-colors flex items-center gap-1 opacity-50 hover:opacity-100" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.innerText).then(() => alert('Copied!'))">
                      <i class="fa-regular fa-copy"></i>
                   </button>
                   ` : ''}
                </div>
            </div>
          `;
          contentElement = div.querySelector('.prose');
          if (text) contentElement.innerHTML = formatText(text);

          // Add Speak Button (Handled by public/assets/js/voice-widget.js)
          const actionsDiv = document.createElement('div');
          actionsDiv.className = "flex justify-end mt-2 gap-2";
          
          const safeText = encodeURIComponent(text);
          actionsDiv.innerHTML = `
             <button class="speak-btn pointer-events-auto text-dim-400 hover:text-accent transition-all duration-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent/10" aria-label="LÃ¦s hÃ¸jt" data-text="${safeText}" onclick="window.speakMessage(this.dataset.text, this); event.stopPropagation();">
                <i class="fa-solid fa-volume-high text-xs"></i>
             </button>
          `;
          div.querySelector('.ai-content-wrapper').appendChild(actionsDiv);
          
          // Process Tags (Charts, Suggestions) for restored history
          if (text) {
               const wrapper = div.querySelector('.ai-content-wrapper');
               processSpecialTags(text, wrapper); 
          }

        } else {
          div.innerHTML = `
            <div class="bg-accent p-4 md:p-5 rounded-sm rounded-tr-none max-w-[85%] text-left shadow-lg font-medium text-sm md:text-base border border-accent">
              <p class="text-neutral-950 font-semibold">${text}</p>
            </div>
          `;
        }

        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;

        return contentElement;
      }

      let typingInterval;

      function showTyping() {
        const msgs = document.getElementById('chat-messages');
        if (!msgs) return;
        
        const div = document.createElement('div');
        div.id = 'fp-typing';
        div.className = 'flex gap-4';
        
        // Initial State
        div.innerHTML = `
           <div class="w-10 h-10 rounded-full bg-accent text-bg flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
              <i class="fa-solid fa-microchip text-lg"></i>
            </div>
            <div class="bg-[rgba(255,255,255,0.05)] border border-accent/20 p-4 rounded-2xl rounded-tl-none flex items-center">
              <span id="typing-text" class="text-xs font-mono text-accent tracking-wider">âš¡ Initializing Quantum Core...</span>
            </div>
        `;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;

        const states = [
            "âš¡ Initializing Quantum Core...",
            "ðŸŒªï¸ Reading Context & Metadata...",
            "ðŸ“š Searching Knowledge Base...",
            "ðŸ§  Analyzing Economic Models...",
            "âœ¨ Generating Response..."
        ];
        
        let stateIdx = 0;
        const textSpan = div.querySelector('#typing-text');
        
        if (textSpan) {
            typingInterval = setInterval(() => {
                stateIdx = (stateIdx + 1) % states.length;
                textSpan.textContent = states[stateIdx];
            }, 800);
        }
      }

      function removeTyping() {
        if (typingInterval) clearInterval(typingInterval);
        const el = document.getElementById('fp-typing');
        if (el) el.remove();
      }

      // Old TTS logic removed - now in /public/assets/js/voice-widget.js

      // Init History
      loadHistory();

      // Catch block removed as try was removed

</script>
<script is:inline src="/assets/js/voice-widget.js">
