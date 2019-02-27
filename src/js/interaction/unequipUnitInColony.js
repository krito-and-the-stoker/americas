import Storage from 'entity/storage'


export default (colony, unit) => {
	Storage.transfer(unit.equipment, colony.storage)
}