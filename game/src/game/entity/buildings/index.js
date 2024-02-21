import BuildingsFactory from './factory'
import house from './house'

export default {
	fortifications: BuildingsFactory.make('fortifications'),
	townhall: BuildingsFactory.make('townhall'),
	tobacconists: BuildingsFactory.make('tobacconists'),
	weavers: BuildingsFactory.make('weavers'),
	rumDistillers: BuildingsFactory.make('rumDistillers'),
	furTraders: BuildingsFactory.make('furTraders'),
	carpenters: BuildingsFactory.make('carpenters'),
	blacksmiths: BuildingsFactory.make('blacksmiths'),
	gunsmiths: BuildingsFactory.make('gunsmiths'),
	harbour: BuildingsFactory.make('harbour'),
	stables: BuildingsFactory.make('stables'),
	school: BuildingsFactory.make('school'),
	church: BuildingsFactory.make('church'),
	house,
}
