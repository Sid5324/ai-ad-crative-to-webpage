// renderer-safety-net.ts - PREVENT JSON IN HTML
export function safeRenderPage(spec: any): string {
  // FAILSAFE - if spec is broken, render minimal page
  if (!spec?.brand || !spec?.hero?.headline) {
    return emergencyLimoTemplate(spec?.targetUrl || '');
  }

  // STRIP DANGEROUS CONTENT
  const safeBrand = (spec.brand || 'Service').replace(/```/g, '');
  const safeHeadline = (spec.hero.headline || 'Premium Service').replace(/```/g, '').replace(/json/g, '');
  const safeSubheadline = (spec.hero.subheadline || 'Book your ride today').replace(/```/g, '');

  return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <title>${safeBrand} - Premium Service</title>
</head>
<body class="font-sans">
  <section class="bg-gradient-to-r from-blue-600 to-indigo-700 min-h-screen flex items-center text-white">
    <div class="max-w-4xl mx-auto p-8 text-center">
      <h1 class="text-4xl font-bold mb-6">${safeHeadline}</h1>
      <p class="text-xl mb-8">${safeSubheadline}</p>
      <a href="#book" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100">
        ${spec.hero.primary_cta || 'Book Now'}
      </a>
    </div>
  </section>
</body>
</html>`;
}

function emergencyLimoTemplate(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <title>A-Star Limousine - Luxury Transport</title>
</head>
<body class="bg-gray-50">
  <section class="bg-gradient-to-br from-black to-gray-900 min-h-screen text-white flex items-center">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h1 class="text-6xl font-bold mb-8">Luxury Limousine Service</h1>
      <p class="text-xl mb-12 max-w-2xl mx-auto">Premium transportation for special occasions. Reliable, professional, on-time.</p>
      <div class="space-x-4">
        <a href="${url || '#'}" class="bg-amber-500 text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-amber-400">Visit Original Site</a>
        <a href="#contact" class="border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black">Get Quote</a>
      </div>
    </div>
  </section>
</body>
</html>`;
}