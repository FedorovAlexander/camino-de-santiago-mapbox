function createMap() {
	console.log('Page is loaded');
	const mapboxkey = config.mapbox;

	mapboxgl.accessToken = mapboxkey;

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/satellite-v9',
		center: [-1.235662, 43.163559],
		zoom: 14,
		pitch: 30,
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
		const pathList = document.getElementById('path-list');

		let newItem = pathList.appendChild(document.createElement('li'));
		newItem.style.backgroundColor = 'salmon';
		newItem.classList.add('path-list__item');
		newItem.innerText = data.features[0].properties.name;

		const coordinates = data.features[0].geometry.coordinates;
		// start by showing just the first coordinate
		data.features[0].geometry.coordinates = [coordinates[0]];

		const speedFactor = 10; // number of frames per longitude degree
		let animation; // to store and cancel the animation
		let startTime = 0;
		let progress = 0; // progress = timestamp - startTime
		let resetTime = false; // indicator of whether time reset is needed for the animation

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

		// map.jumpTo({ center: coordinates[0], zoom: 14 });
		// map.setPitch(30);
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

	// map.on('load', () => {
	// 	const animationDuration = 1000000;
	// 	const cameraAltitude = 3000;
	// 	console.log(coordinates, 'coordinates');
	// 	const targetRoute = coordinates.geometry.coordinates;
	// 	const cameraRoute = coordinates.geometry.coordinates.map((point) => {
	// 		return [point[0], point[1]];
	// 	});

	// 	// get the overall distance of each route so we can interpolate along them
	// 	const routeDistance = turf.lineDistance(turf.lineString(targetRoute));
	// 	const cameraRouteDistance = turf.lineDistance(turf.lineString(cameraRoute));

	// 	let start;

	// 	function frame(time) {
	// 		if (!start) start = time;
	// 		// phase determines how far through the animation we are
	// 		const phase = (time - start) / animationDuration;

	// 		// phase is normalized between 0 and 1
	// 		// when the animation is finished, reset start to loop the animation
	// 		// if (phase > 1) {
	// 		// 	// wait 1.5 seconds before looping
	// 		// 	setTimeout(() => {
	// 		// 		start = 0.0;
	// 		// 	}, 5000);
	// 		// }

	// 		// use the phase to get a point that is the appropriate distance along the route
	// 		// this approach syncs the camera and route positions ensuring they move
	// 		// at roughly equal rates even if they don't contain the same number of points
	// 		const alongRoute = turf.along(turf.lineString(targetRoute), routeDistance * phase).geometry.coordinates;

	// 		const alongCamera = turf.along(turf.lineString(cameraRoute), cameraRouteDistance * phase).geometry.coordinates;

	// 		const camera = map.getFreeCameraOptions();
	// 		console.log(alongCamera, 'alongCamera');
	// 		// set the position and altitude of the camera
	// 		camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
	// 			{
	// 				lng: alongCamera[0],
	// 				lat: alongCamera[1],
	// 			},
	// 			cameraAltitude
	// 		);

	// 		// tell the camera to look at a point along the route
	// 		camera.lookAtPoint({
	// 			lng: alongRoute[0],
	// 			lat: alongRoute[1],
	// 		});

	// 		// map.setFreeCameraOptions(camera);

	// 		// window.requestAnimationFrame(frame);
	// 	}

	// 	window.requestAnimationFrame(frame);
	// });
}

window.onload = createMap;
