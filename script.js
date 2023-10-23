function createMap() {
	console.log('Page is loaded');
	const mapboxkey = config.mapbox;

	mapboxgl.accessToken = mapboxkey;

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/outdoors-v12',
		center: [-1.235662, 43.163559],
		zoom: 14,
		// pitch: 65,
		bearing: -160,
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

		let newItem = pathList.appendChild(document.createElement('li'));
		newItem.style.backgroundColor = '#006D75';
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
				'line-color': '#006D75',
				'line-width': 5,
			},
			layout: {
				'line-cap': 'round',
				'line-join': 'round',
			},
		});
	});

	map.on('load', () => {
		const animationDuration = 1000000;
		const cameraAltitude = 8000;
		console.log(coordinates, 'coordinates');
		const targetRoute = coordinates.geometry.coordinates;
		// this is the path the camera will move along
		const cameraRoute = coordinates.geometry.coordinates.map((point) => {
			return [point[0], point[1]];
		});
		// get the overall distance of each route so we can interpolate along them
		const routeDistance = turf.lineDistance(turf.lineString(targetRoute));
		const cameraRouteDistance = turf.lineDistance(turf.lineString(cameraRoute));

		let start;

		function frame(time) {
			if (!start) start = time;
			// phase determines how far through the animation we are
			const phase = (time - start) / animationDuration;

			// phase is normalized between 0 and 1
			// when the animation is finished, reset start to loop the animation
			if (phase > 1) {
				// wait 1.5 seconds before looping
				setTimeout(() => {
					start = 0.0;
				}, 5000);
			}

			// use the phase to get a point that is the appropriate distance along the route
			// this approach syncs the camera and route positions ensuring they move
			// at roughly equal rates even if they don't contain the same number of points
			const alongRoute = turf.along(turf.lineString(targetRoute), routeDistance * phase).geometry.coordinates;

			const alongCamera = turf.along(turf.lineString(cameraRoute), cameraRouteDistance * phase).geometry.coordinates;

			const camera = map.getFreeCameraOptions();

			// set the position and altitude of the camera
			camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
				{
					lng: alongCamera[0],
					lat: alongCamera[1],
				},
				cameraAltitude
			);

			// tell the camera to look at a point along the route
			camera.lookAtPoint({
				lng: alongRoute[0],
				lat: alongRoute[1],
			});

			map.setFreeCameraOptions(camera);

			window.requestAnimationFrame(frame);
		}

		window.requestAnimationFrame(frame);
	});
}

window.onload = createMap;
