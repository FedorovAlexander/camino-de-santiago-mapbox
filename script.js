function createMap() {
	console.log('Page is loaded');
	const mapboxkey = config.mapbox;

	mapboxgl.accessToken = mapboxkey;

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/outdoors-v12',
		center: [-3.70256, 40.4165],
		zoom: 5,
		// pitch: 65,
		// bearing: -180,
		// interactive: false,
	});

	const url = './data/Camino-de-Santiago.geojson';

	fetch(url)
		.then((response) => {
			return response.json();
		})
		.then((data) => {
			createRoute(map, data.features);
		});
}

function createRoute(map, coordinates) {
	console.log(map, coordinates);
	map.on('load', () => {
		map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512,
			maxzoom: 14,
		});
		map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

		coordinates.forEach((trace, index) => {
			const sourceId = `trace-${index}`;
			map.addSource(sourceId, {
				type: 'geojson',
				data: trace,
			});
			map.addLayer({
				type: 'line',
				source: sourceId,
				id: `line-${index}`,
				paint: {
					'line-color': '#e2725b',
					'line-width': 5,
				},
				layout: {
					'line-cap': 'round',
					'line-join': 'round',
				},
			});
		});
	});
}

window.onload = createMap;
