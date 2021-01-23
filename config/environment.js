var environments = {
	staging: {
		FIREBASE_API_KEY: 'AIzaSyCTKmzjt4CX_9mr_yGfq2Mc4x-kUEGkUE4',
		FIREBASE_AUTH_DOMAIN: 'my-second-417db.firebaseapp.com',
		FIREBASE_DATABASE_URL: 'gs://my-second-417db.appspot.com',
		FIREBASE_PROJECT_ID: 'my-second-417db',
		FIREBASE_STORAGE_BUCKET: 'my-second-417db.appspot.com',
		FIREBASE_MESSAGING_SENDER_ID: '399237918779',
		GOOGLE_CLOUD_VISION_API_KEY: 'AIzaSyCERFACoIpMWE7IQY5Scb2CxqGH3EMsOw8'
	},
	production: {
		// Warning: This file still gets included in your native binary and is not a secure way to store secrets if you build for the app stores. Details: https://github.com/expo/expo/issues/83
	}
};

  
function getReleaseChannel() {
	let releaseChannel = Expo.Constants.manifest.releaseChannel;
	if (releaseChannel === undefined) {
		return 'staging';
	} else if (releaseChannel === 'staging') {
		return 'staging';
	} else {
		return 'staging';
	}
}
function getEnvironment(env) {
	console.log('Release Channel: ', getReleaseChannel());
	return environments[env];
}
var Environment = getEnvironment(getReleaseChannel());
export default Environment;