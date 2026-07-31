export async function loadComponents() {
  const elements = document.querySelectorAll('[data-component]');
  
  const promises = Array.from(elements).map(async (el) => {
    const componentName = el.getAttribute('data-component');
    try {
      // Add a timestamp cache buster so GitHub Pages and localhost always load the latest component HTML
      const response = await fetch(`./components/${componentName}.html?v=${new Date().getTime()}`);
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
