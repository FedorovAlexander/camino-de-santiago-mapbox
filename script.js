function createMap() {
	console.log('Page is loaded');
	const mapboxkey = config.mapbox;

	mapboxgl.accessToken = mapboxkey;

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v11',
		center: [-3.70256, 40.4165],
		zoom: 5,
	});
}

window.onload = createMap;
