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
			createRoute(map, data.features[1]);
		});
}

function createRoute(map, coordinates) {
	console.log(coordinates);
	console.log(map, coordinates);
	map.on('load', () => {
		map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512,
			maxzoom: 14,
		});
		map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
		const pathList = document.getElementById('path-list');
		const colors = ['#006D75', 'lightblue'];

		let newItem = pathList.appendChild(document.createElement('li'));
		newItem.style.backgroundColor = colors[0];
		newItem.classList.add('path-list__item');
		newItem.innerText = coordinates.properties.name;

		map.addSource('trace', {
			type: 'geojson',
			data: coordinates,
		});
		map.addLayer({
			type: 'line',
			source: 'trace',
			id: `line`,
			paint: {
				'line-color': colors[0],
				'line-width': 5,
			},
			layout: {
				'line-cap': 'round',
				'line-join': 'round',
			},
		});
	});
}

window.onload = createMap;
