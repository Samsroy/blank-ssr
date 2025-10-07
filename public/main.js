document.getElementById('ping').addEventListener('click', () => {
  const status = document.getElementById('status');
  status.textContent = 'Pong!';
  setTimeout(() => (status.textContent = ''), 1500);
});
console.log('App initialized');
