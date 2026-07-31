export async function loadComponents() {
  const elements = document.querySelectorAll('[data-component]');
  
  const promises = Array.from(elements).map(async (el) => {
    const componentName = el.getAttribute('data-component');
    try {
      const response = await fetch(`./components/${componentName}.html`);
      if (response.ok) {
        const html = await response.text();
        el.innerHTML = html;
        el.removeAttribute('data-component');
      } else {
        console.error(`Failed to load component: ${componentName}`);
      }
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
    }
  });

  await Promise.all(promises);
  
  document.dispatchEvent(new Event('componentsLoaded'));
}
