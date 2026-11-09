import { getLangslateProductForHostname, normalizeHostname } from "./langslateDomains.mjs";

const MAIN_APP_HOSTNAMES = new Set(["ai-business-english.vercel.app", "localhost", "127.0.0.1"]);

export function getProtectedProductContentDocument(library, slug) {
  if (library === "langslate-flow" && slug === "app") return "flow";
  if (library === "langslate-365" && slug === "course") return "365";
  return null;
}

export function getProductContentDocumentAccess(hostname, requestedProduct, authenticated) {
  const normalizedHostname = normalizeHostname(hostname);
  const hostProduct = getLangslateProductForHostname(normalizedHostname);
  if (hostProduct) {
    if (hostProduct !== requestedProduct) return "wrong-host";
  } else if (!MAIN_APP_HOSTNAMES.has(normalizedHostname)) {
    return "wrong-host";
  }

  return authenticated ? "allow" : "unauthenticated";
}

export function injectProductSignOutControl(html, product) {
  if (product === "flow") {
    const integration = `<script>(function(){var authPath='/auth?next=%2Fapps%2Fflow%2Fpractice';try{if(location.hash!=='#/app')history.replaceState(history.state,'',location.pathname+location.search+'#/app')}catch(e){}document.addEventListener('click',function(event){var target=event.target;if(!target||typeof target.closest!=='function')return;var control=target.closest('[data-act],#logoutBtn');if(!control)return;var action=control.getAttribute('data-act');if(action==='logout'||control.id==='logoutBtn'){event.preventDefault();event.stopImmediatePropagation();window.parent.postMessage({type:'langslate:sign-out'},window.location.origin);return}if(action==='loginTop'||action==='authGoogle'||action==='openAuth'){event.preventDefault();event.stopImmediatePropagation();window.top.location.assign(authPath)}},true)})();</script>`;
    return /<script\b/i.test(html) ? html.replace(/<script\b/i, `${integration}<script`) : `${html}${integration}`;
  }

  const targetSelector = product === "365" ? ".sb-footer" : null;
  if (!targetSelector) return html;
  const signOutSpacing = product === "365" ? 12 : 8;

  const injected = `<style>.langslate-product-signout{display:inline-block;margin-top:${signOutSpacing}px;padding:6px 0;border:0;background:transparent;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;opacity:.8}.langslate-product-signout:hover{opacity:1}.langslate-product-signout:focus-visible{outline:2px solid currentColor;outline-offset:3px}</style><script>(function(){function addSignOut(){var slot=document.querySelector(${JSON.stringify(targetSelector)});if(!slot||document.getElementById('langslate-product-signout'))return;var button=document.createElement('button');button.id='langslate-product-signout';button.type='button';button.className='langslate-product-signout';button.textContent='Sign out';button.addEventListener('click',function(){window.parent.postMessage({type:'langslate:sign-out'},window.location.origin)});slot.appendChild(button)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addSignOut,{once:true});else addSignOut()})();</script>`;
  return /<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>/i, `${injected}</body>`) : `${html}${injected}`;
}

export function injectProduct365LandingActions(html) {
  const integration = `<script>(function(){var authPath='/auth?next=%2Fapps%2F365%2Fcourse';function goToAuth(){window.top.location.assign(authPath)}function unavailable(){if(typeof window.showToast==='function')window.showToast('This option is not available yet.','ℹ️')}window.enterCourse=goToAuth;window.handleLogin=goToAuth;window.handleSignup=goToAuth;window.handleGoogleAuth=goToAuth;window.handleDemoAccess=unavailable;window.handlePlanSelect=unavailable;window.useDemoCode=unavailable;var originalOpenModal=window.openModal;if(typeof originalOpenModal==='function')window.openModal=function(modal){if(modal==='loginModal'||modal==='signupModal'){goToAuth();return}if(modal==='demoModal'){unavailable();return}return originalOpenModal.apply(this,arguments)}})();</script>`;
  return /<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>/i, `${integration}</body>`) : `${html}${integration}`;
}
