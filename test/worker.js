const main = await new Promise(resolve => {
  addEventListener(
    'message',
    ({ ports: [ port ] }) => {
      port.start();
      resolve('world');
    },
    // drop once initialized
    { once: true }
  );
});

console.log('hello', main);
