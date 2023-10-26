import flyInAndRotate from './fly-in-and-rotate.js';
import animatePath from './animate-path.js';
import { createGeoJSONCircle } from './util.js';

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
		bearing: 0,
	});

	const url = './data/Camino-de-Santiago.geojson';

	fetch(url)
		.then((response) => {
			return response.json();
		})
		.then((data) => {
			createRoute(map, data);
			setTimeout(() => {
				console.log('fitBounds');
				map.fitBounds([
					[-118.4124705, 34.2363116],
					[-118.4097024, 34.2335619],
				]);
			}, 15000);
		});
}

function createRoute(map, data) {
	map.on('load', () => {
		map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512,
		});
		map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
		map.setFog({});

		let now = performance.now();
		mapboxgl.setNow(now);
		const trackGeojson = data;

		map.addSource('trace', {
			type: 'geojson',
			data: data,
		});

		playAnimations(trackGeojson);
	});

	const playAnimations = async (trackGeojson) => {
		return new Promise(async (resolve) => {
			// add a geojson source and layer for the linestring to the map
			addPathSourceAndLayer(trackGeojson);

			// get the start of the linestring, to be used for animating a zoom-in from high altitude
			var targetLngLat = {
				lng: trackGeojson.features[0].geometry.coordinates[0][0],
				lat: trackGeojson.features[0].geometry.coordinates[0][1],
			};

			// animate zooming in to the start point, get the final bearing and altitude for use in the next animation
			const { bearing, altitude } = await flyInAndRotate({
				map,
				targetLngLat,
				duration: 4000,
				startAltitude: 3000000,
				endAltitude: 12000,
				startBearing: 0,
				endBearing: -20,
				startPitch: 40,
				endPitch: 50,
			});

			// follow the path while slowly rotating the camera, passing in the camera bearing and altitude from the previous animation
			await animatePath({
				map,
				duration: 10000,
				path: trackGeojson.features[0],
				startBearing: bearing,
				startAltitude: altitude,
				pitch: 50,
			});

			// get the bounds of the linestring, use fitBounds() to animate to a final view
			const bounds = turf.bbox(trackGeojson);
			map.fitBounds(bounds, {
				duration: 3000,
				pitch: 30,
				bearing: 0,
				padding: 120,
			});

			setTimeout(() => {
				resolve();
			}, 14000);
		});
	};

	const addPathSourceAndLayer = (trackGeojson) => {
		// Add a line feature and layer. This feature will get updated as we progress the animation
		map.addSource('line', {
			type: 'geojson',
			// Line metrics is required to use the 'line-progress' property
			lineMetrics: true,
			data: trackGeojson,
		});
		map.addLayer({
			id: 'line-layer',
			type: 'line',
			source: 'line',
			paint: {
				'line-color': 'rgba(0,0,0,0)',
				'line-width': 9,
				'line-opacity': 0.8,
			},
			layout: {
				'line-cap': 'round',
				'line-join': 'round',
			},
		});

		map.addSource('start-pin-base', {
			type: 'geojson',
			data: createGeoJSONCircle(trackGeojson.features[0].geometry.coordinates[0], 0.04),
		});

		map.addSource('start-pin-top', {
			type: 'geojson',
			data: createGeoJSONCircle(trackGeojson.features[0].geometry.coordinates[0], 0.25),
		});

		map.addSource('end-pin-base', {
			type: 'geojson',
			data: createGeoJSONCircle(trackGeojson.features[0].geometry.coordinates.slice(-1)[0], 0.04),
		});

		map.addSource('end-pin-top', {
			type: 'geojson',
			data: createGeoJSONCircle(trackGeojson.features[0].geometry.coordinates.slice(-1)[0], 0.25),
		});

		map.addLayer({
			id: 'start-fill-pin-base',
			type: 'fill-extrusion',
			source: 'start-pin-base',
			paint: {
				'fill-extrusion-color': '#0bfc03',
				'fill-extrusion-height': 1000,
			},
		});
		map.addLayer({
			id: 'start-fill-pin-top',
			type: 'fill-extrusion',
			source: 'start-pin-top',
			paint: {
				'fill-extrusion-color': '#0bfc03',
				'fill-extrusion-base': 1000,
				'fill-extrusion-height': 1200,
			},
		});

		map.addLayer({
			id: 'end-fill-pin-base',
			type: 'fill-extrusion',
			source: 'end-pin-base',
			paint: {
				'fill-extrusion-color': '#eb1c1c',
				'fill-extrusion-height': 1000,
			},
		});
		map.addLayer({
			id: 'end-fill-pin-top',
			type: 'fill-extrusion',
			source: 'end-pin-top',
			paint: {
				'fill-extrusion-color': '#eb1c1c',
				'fill-extrusion-base': 1000,
				'fill-extrusion-height': 1200,
			},
		});
	};
}

window.onload = createMap;
