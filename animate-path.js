import { computeCameraPosition } from './util.js';

const animatePath = ({ map, duration, path, startBearing, startAltitude, pitch }) => {
	return new Promise((resolve) => {
		const pathDistance = turf.lineDistance(path);
		let startTime;

		const animate = (timestamp) => {
			if (!startTime) startTime = timestamp;
			const animationPhase = (timestamp - startTime) / duration;

			if (animationPhase > 1) {
				resolve();
			} else {
				const alongPath = turf.along(path, pathDistance * animationPhase).geometry.coordinates;

				const lngLat = {
					lng: alongPath[0],
					lat: alongPath[1],
				};

				map.setPaintProperty('line-layer', 'line-gradient', ['step', ['line-progress'], 'yellow', animationPhase, 'rgba(0, 0, 0, 0)']);

				const bearing = startBearing - animationPhase * 200.0;

				var correctedPosition = computeCameraPosition(pitch, bearing, lngLat, startAltitude, true);

				const camera = map.getFreeCameraOptions();
				camera.setPitchBearing(pitch, bearing);
				camera.position = mapboxgl.MercatorCoordinate.fromLngLat(correctedPosition, startAltitude);
				map.setFreeCameraOptions(camera);

				requestAnimationFrame(animate);
			}
		};

		requestAnimationFrame(animate);
	});
};

export default animatePath;
