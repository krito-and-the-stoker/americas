import Notification from 'view/ui/notification'

export default (settlement, unit) => {
	Notification.create({ type: 'settlement', settlement, unit })
}