import flyInAndRotate from './fly-in-and-rotate.js';
import animatePath from './animate-path.js';

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
			endAltitude: 12000,
			startBearing: 0,
			endBearing: -20,
			startPitch: 40,
			endPitch: 50,
		});

		// follow the path while slowly rotating the camera, passing in the camera bearing and altitude from the previous animation
		const animationResult = await animatePath({
			map,
			duration: 150000,
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

	//add titles of the cities for the start and end points
	map.addSource('start-title', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: trackGeojson.features[0].geometry.coordinates[0],
					},
					properties: {
						title: 'Saint-Jean-Pied-de-Port',
					},
				},
			],
		},
	});

	map.addSource('end-title', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: trackGeojson.features[0].geometry.coordinates.slice(-1)[0],
					},
					properties: {
						title: 'Santiago de Compostela',
					},
				},
			],
		},
	});

	map.addLayer({
		id: 'start-title',
		type: 'symbol',
		source: 'start-title',
		layout: {
			'text-field': ['get', 'title'],
			'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
			'text-size': 16,
			'text-anchor': 'bottom',
		},
		paint: {
			'text-color': '#ffffff',
		},
	});

	map.addLayer({
		id: 'end-title',
		type: 'symbol',
		source: 'end-title',
		layout: {
			'text-field': ['get', 'title'],
			'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
			'text-size': 16,
			'text-anchor': 'bottom',
		},
		paint: {
			'text-color': '#ffffff',
		},
	});

	const cities = [
		{ Jaca: [-0.55, 42.57] },
		{ Pamplona: [-1.65, 42.8167] },
		{ Logroño: [-2.45, 42.4667] },
		{ Nájera: [-2.7333, 42.4167] },
		{ 'Santo Domingo de la Calzada': [-2.9517, 42.4383] },
		{ Burgos: [-3.6961, 42.3433] },
		{ Frómista: [-4.2994, 42.2644] },
		{ León: [-5.5671, 42.5986] },
		{ Astorga: [-6.0639, 42.4514] },
		{ Ponferrada: [-6.5872, 42.5467] },
	];

	//create a title for each city along the route. Cities should be visible at zoom level 8
	cities.forEach((city) => {
		const cityName = Object.keys(city)[0];
		const cityCoordinates = city[cityName];
		map.addSource(cityName, {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: cityCoordinates,
						},
						properties: {
							title: cityName,
						},
					},
				],
			},
		});
		map.addLayer({
			id: cityName,
			type: 'symbol',
			source: cityName,
			layout: {
				'text-field': ['get', 'title'],
				'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
				'text-size': 18,
				'text-anchor': 'left',
			},
			paint: {
				'text-color': '#ffffff',
			},
			minzoom: 8,
		});
	});
};

window.onload = createMap;
