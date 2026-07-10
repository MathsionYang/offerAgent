(() => {
  const illustrations = Object.freeze({
    candidate: String.raw`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 460" aria-hidden="true" focusable="false">
        <rect width="640" height="460" fill="#E8F7F2"/>
        <path d="M0 332C105 295 189 314 275 348C364 383 477 398 640 337V460H0Z" fill="#CDECE2"/>
        <circle cx="98" cy="94" r="42" fill="#F7C85B" opacity=".8"/>
        <path d="M76 167h111M57 196h74" fill="none" stroke="#79BEA8" stroke-width="12" stroke-linecap="round" opacity=".55"/>
        <rect x="421" y="70" width="146" height="94" rx="8" fill="#FFFFFF" stroke="#B7DED2" stroke-width="4"/>
        <path d="M448 103h76M448 128h92" fill="none" stroke="#79BEA8" stroke-width="9" stroke-linecap="round"/>
        <circle cx="438" cy="103" r="6" fill="#F08C69"/>
        <circle cx="438" cy="128" r="6" fill="#F7C85B"/>
        <ellipse cx="321" cy="424" rx="177" ry="20" fill="#7CB8A5" opacity=".22"/>
        <path d="M225 288c18-53 62-83 111-83 55 0 97 28 119 83l35 116H187Z" fill="#246B60"/>
        <path d="M286 230h94l-13 76h-69Z" fill="#FFF9F2"/>
        <path d="M298 238l35 48 35-48-7 70h-56Z" fill="#F4D3BE"/>
        <path d="M274 294c-31 7-52 31-62 64l-14 46h81l24-92Z" fill="#2F8475"/>
        <path d="M393 294c30 8 51 32 61 65l13 45h-80l-25-92Z" fill="#2F8475"/>
        <path d="M283 155c0-65 35-105 89-105 51 0 91 38 91 97 0 18-4 34-11 47-10-25-32-45-58-55-38 29-76 35-111 26Z" fill="#203B45"/>
        <path d="M291 143c2-46 28-75 76-75 46 0 75 31 75 80v34c0 53-32 91-74 91-43 0-77-37-77-89Z" fill="#F4C8AA"/>
        <path d="M292 154c33-1 69-13 101-38 18 9 36 25 48 43v-24c0-45-31-72-74-72-47 0-75 31-75 79Z" fill="#263E47"/>
        <path d="M302 180c0 8-6 15-14 15s-14-7-14-15 6-15 14-15 14 7 14 15Zm167 0c0 8-6 15-14 15s-14-7-14-15 6-15 14-15 14 7 14 15Z" fill="#F4C8AA"/>
        <circle cx="333" cy="177" r="5" fill="#203B45"/>
        <circle cx="403" cy="177" r="5" fill="#203B45"/>
        <path d="M347 211c13 10 28 10 41 0" fill="none" stroke="#B65F54" stroke-width="5" stroke-linecap="round"/>
        <path d="M323 160c11-7 22-8 34-3M385 157c11-4 22-3 32 4" fill="none" stroke="#203B45" stroke-width="6" stroke-linecap="round"/>
        <path d="M431 108c19-20 24-44 17-71 30 20 44 57 35 91-6 22-19 40-39 52Z" fill="#203B45"/>
        <rect x="257" y="304" width="151" height="112" rx="8" fill="#FFFDF9" stroke="#F08C69" stroke-width="5" transform="rotate(-5 257 304)"/>
        <path d="M282 333l11 11 20-25M323 330h56M283 367l11 11 20-25M324 364h47" fill="none" stroke="#2F8475" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M244 338c16-9 34-8 50 4l-3 34c-19 4-36-3-48-18Z" fill="#F4C8AA"/>
        <path d="M410 341c-15-10-34-10-50 1l2 35c19 5 36-1 49-16Z" fill="#F4C8AA"/>
      </svg>
    `,
    interviewer: String.raw`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 460" aria-hidden="true" focusable="false">
        <rect width="640" height="460" fill="#FFF0E8"/>
        <path d="M0 350C129 304 228 340 321 371C417 403 514 394 640 346V460H0Z" fill="#F8D9CA"/>
        <rect x="68" y="75" width="153" height="111" rx="8" fill="#FFFFFF" stroke="#F3B69D" stroke-width="4"/>
        <path d="M96 108h91M96 137h64" fill="none" stroke="#E98967" stroke-width="10" stroke-linecap="round"/>
        <path d="M176 151l14 14 26-32" fill="none" stroke="#31947E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="540" cy="91" r="37" fill="#78C9B2" opacity=".85"/>
        <path d="M480 182h92M514 211h68" fill="none" stroke="#E98967" stroke-width="12" stroke-linecap="round" opacity=".5"/>
        <ellipse cx="329" cy="426" rx="184" ry="20" fill="#B36E55" opacity=".2"/>
        <path d="M199 404c8-72 43-120 104-139l57-2c60 19 98 67 109 141Z" fill="#263A59"/>
        <path d="M286 262h91l-8 83h-73Z" fill="#F8FAFC"/>
        <path d="M301 273l31 36 31-36-6 79h-51Z" fill="#E8B897"/>
        <path d="M303 327l29 28 29-28 12 77h-81Z" fill="#E98967"/>
        <path d="M244 308c-30 17-46 49-51 96h83l28-105Z" fill="#314B70"/>
        <path d="M413 309c31 18 48 49 54 95h-85l-28-105Z" fill="#314B70"/>
        <path d="M267 139c2-57 34-94 88-94 56 0 91 36 92 95l-5 41H270Z" fill="#25313A"/>
        <path d="M279 143c0-47 27-75 74-75 47 0 76 28 76 76v38c0 54-32 91-75 91-44 0-75-37-75-91Z" fill="#DFA982"/>
        <path d="M279 151c30-10 53-27 68-51 28 26 53 41 82 48v-17c0-43-30-68-75-68-46 0-75 28-75 73Z" fill="#2B363F"/>
        <path d="M287 179c0 9-7 16-15 16s-15-7-15-16 7-16 15-16 15 7 15 16Zm164 0c0 9-7 16-15 16s-15-7-15-16 7-16 15-16 15 7 15 16Z" fill="#DFA982"/>
        <circle cx="319" cy="177" r="5" fill="#25313A"/>
        <circle cx="390" cy="177" r="5" fill="#25313A"/>
        <path d="M335 214c13 8 27 8 40 0" fill="none" stroke="#945447" stroke-width="5" stroke-linecap="round"/>
        <path d="M305 158c10-5 21-6 31-2M374 156c11-3 22-2 31 3" fill="none" stroke="#25313A" stroke-width="6" stroke-linecap="round"/>
        <rect x="296" y="159" width="48" height="34" rx="12" fill="none" stroke="#263A59" stroke-width="6"/>
        <rect x="365" y="159" width="48" height="34" rx="12" fill="none" stroke="#263A59" stroke-width="6"/>
        <path d="M344 174h21" fill="none" stroke="#263A59" stroke-width="6"/>
        <rect x="399" y="284" width="142" height="127" rx="8" fill="#FFFDF9" stroke="#31947E" stroke-width="5" transform="rotate(6 399 284)"/>
        <rect x="443" y="274" width="55" height="20" rx="8" fill="#31947E" transform="rotate(6 443 274)"/>
        <path d="M428 319h77M428 348h62M428 377h71" fill="none" stroke="#8DA3A0" stroke-width="9" stroke-linecap="round"/>
        <circle cx="417" cy="319" r="6" fill="#E98967"/>
        <circle cx="417" cy="348" r="6" fill="#F2BC4F"/>
        <circle cx="417" cy="377" r="6" fill="#31947E"/>
        <path d="M389 348c19-12 38-10 55 5l-3 35c-20 5-38-2-51-20Z" fill="#DFA982"/>
        <path d="M278 350c-18-13-38-12-55 2l2 35c20 6 38 0 52-17Z" fill="#DFA982"/>
      </svg>
    `,
  });

  function renderPersonaIllustrations(root = document) {
    root.querySelectorAll("[data-persona-illustration]").forEach((target) => {
      const svg = illustrations[target.dataset.personaIllustration];
      if (!svg) return;
      const template = document.createElement("template");
      template.innerHTML = svg.trim();
      target.replaceChildren(template.content.cloneNode(true));
    });
  }

  window.OfferAgentPersonaIllustrations = Object.freeze({
    illustrations,
    renderPersonaIllustrations,
  });

  renderPersonaIllustrations();
})();
