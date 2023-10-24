function createMap() {
	console.log('Page is loaded');
	const mapboxkey = config.mapbox;

	mapboxgl.accessToken = mapboxkey;

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/satellite-v9',
		center: [-1.235662, 43.163559],
		zoom: 14,
		pitch: 70,
		bearing: -160,
		bearingSnap: true,
		interactive: true,
	});

	const url = './data/Camino-de-Santiago.geojson';

	fetch(url)
		.then((response) => {
			return response.json();
		})
		.then((data) => {
			createRoute(map, data);
		});
}

function createRoute(map, data) {
	// console.log(data);
	// console.log(map, data);
	map.on('load', () => {
		map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512,
			maxzoom: 14,
		});
		map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
		map.setFog({
			color: 'rgb(186, 210, 235)', // Lower atmosphere
			'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
			'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
			'space-color': 'rgb(11, 11, 25)', // Background color
			'star-intensity': 0.6, // Background star brightness (default 0.35 at low zoooms )
		});
		const pathList = document.getElementById('path-list');

		let newItem = pathList.appendChild(document.createElement('li'));
		newItem.style.backgroundColor = 'salmon';
		newItem.classList.add('path-list__item');
		newItem.innerText = data.features[0].properties.name;

		const coordinates = data.features[0].geometry.coordinates;
		// start by showing just th	e first coordinate
		data.features[0].geometry.coordinates = [coordinates[0]];

		map.addSource('trace', {
			type: 'geojson',
			data: data,
		});
		map.addLayer({
			type: 'line',
			source: 'trace',
			id: `line`,
			paint: {
				'line-color': 'rgba(255, 0, 0, 0.4)',
				'line-width': 5,
			},
			layout: {
				'line-cap': 'round',
				'line-join': 'round',
			},
		});
		startTime = performance.now();

		document.addEventListener('visibilitychange', () => {
			resetTime = true;
		});

		let i = 0;
		const timer = setInterval(() => {
			if (i < coordinates.length) {
				data.features[0].geometry.coordinates.push(coordinates[i]);
				map.getSource('trace').setData(data);
				map.flyTo({
					center: coordinates[i],
					zoom: 14,
					speed: 0.1,
					curve: 1,
				});
				i++;
			} else {
				window.clearInterval(timer);
			}
		}, 1000);
	});
}

window.onload = createMap;
