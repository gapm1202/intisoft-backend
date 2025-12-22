require('ts-node/register');
const routes = require('../src/modules/catalogo/routes/catalogo.routes').default;
console.log('Routes type:', typeof routes);
if (routes && routes.stack) {
  console.log('Routes stack length:', routes.stack.length);
  routes.stack.forEach((layer, i) => console.log(i, layer.route ? Object.keys(layer.route.methods) + ' ' + layer.route.path : layer.name));
} else {
  console.log('No routes.stack');
}