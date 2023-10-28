import flyInAndRotate from './fly-in-and-rotate.js';
import animatePath from './animate-path.js';
import { createGeoJSONCircle } from './util.js';

function createMap() {
	const mapboxkey = config.mapbox;

	mapboxgl.accessToken = mapboxkey;

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/alex2240/clo8km0ht00x901qmgx8x8x5y',
		center: [-1.235662, 43.163559],
		zoom: 1.9466794621990684,
		pitch: 30,
		bearing: 0,
	});
	window.map = map;
	createRoute(map);
}

function createRoute(map) {
	map.on('load', async () => {
		map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512,
		});
		map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
		map.setFog({});

		const url = './data/Camino-de-Santiago.geojson';
		const trackGeojson = await fetch(url).then((response) => {
			return response.json();
		});
		await playAnimations(trackGeojson).then(() => {
			setTimeout(() => {
				const bounds = turf.bbox(trackGeojson);
				map.fitBounds(bounds, {
					duration: 10000,
					pitch: 30,
					bearing: 0,
					padding: 120,
				});
			}, 1000);
		});
	});
}

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
			endAltitude: 7000,
			startBearing: 0,
			endBearing: -20,
			startPitch: 40,
			endPitch: 50,
		});

		// follow the path while slowly rotating the camera, passing in the camera bearing and altitude from the previous animation
		const animationResult = await animatePath({
			map,
			duration: 30000,
			path: trackGeojson.features[0],
			startBearing: bearing,
			startAltitude: altitude,
			pitch: 50,
		});

		resolve(animationResult);
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
};

window.onload = createMap;
