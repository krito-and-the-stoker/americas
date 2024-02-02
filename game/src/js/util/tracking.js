import { v4 as uuidv4 } from 'uuid';

let userId = localStorage.getItem('userId');
if (!userId) {
    userId = uuidv4();
    localStorage.setItem('userId', userId);
}

const trackEvent = async (name) => {
	await fetch('/api/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, userId }),
	})
	.then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();
	})
	.then(data => console.log('Success:', data))
	.catch((error) => console.error('Error:', error));
}

const pageView = () => trackEvent('PageView')
const newGame = () => trackEvent('NewGame')
const resumeGame = () => trackEvent('ResumeGame')

export default {
	pageView,
	newGame,
	resumeGame
}