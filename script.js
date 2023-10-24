function createMap() {
	console.log('Page is loaded');
	const mapboxkey = config.mapbox;

	mapboxgl.accessToken = mapboxkey;

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/satellite-v9',
		center: [-1.235662, 43.163559],
		zoom: 5,
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
	map.on('load', () => {
		map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512,
			maxzoom: 5,
		});
		map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
		map.setFog({});
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

		let i = 0;
		const timer = setInterval(() => {
			if (i < coordinates.length) {
				data.features[0].geometry.coordinates.push(coordinates[i]);
				map.getSource('trace').setData(data);
				i++;
			} else {
				window.clearInterval(timer);
			}
		}, 250);

		// animate camera
		const targetRoute = coordinates;
		const cameraRoute = coordinates;
		const animationDuration = 6031000 / 4;
		const cameraAltitude = 5000;
		// get the overall distance of each route so we can interpolate along them
		if (targetRoute.length >= 2) {
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
					}, 1500);
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
		}
	});
}

window.onload = createMap;
