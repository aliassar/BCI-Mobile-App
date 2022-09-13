/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native/dist/platform_react_native';

import * as cocossd from '@tensorflow-models/coco-ssd';
import {Camera} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  fetch,
  bundleResourceIO,
  decodeJpeg,
} from '@tensorflow/tfjs-react-native';
import * as jpeg from 'jpeg-js';
import * as toxicity from '@tensorflow-models/toxicity';
import * as FileSystem from 'expo-file-system';

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const [tfReady, setTfReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [image, setImage] = useState();
  const [predictions, setPredictions] = useState();
  const [model, setModel] = useState();
  const imageToTensor = rawImageData => {
    const TO_UINT8ARRAY = true;
    const {width, height, data} = jpeg.decode(rawImageData, TO_UINT8ARRAY);
    // Drop the alpha channel info for COCO-SSD
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0; // offset into original data
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];
      offset += 4;
    }
    return tf.tensor3d(buffer, [height, width, 3]);
  };
  const detectObjects = async image => {
    try {
      const imageAssetPath = Image.resolveAssetSource(image);
      const imgB64 = await FileSystem.readAsStringAsync(imageAssetPath.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const raw = new Uint8Array(imgBuffer);
      const imageTensor = decodeJpeg(raw);
      const tfPredictions = await model.detect(imageTensor);
      console.log('egweg');
      setPredictions(tfPred024ictions);
      console.log(tfPredictions);
    } catch (error) {
      console.log('Exception Error: ', error);
    }
  };
  const selectImage = async () => {
    try {
      let response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
      });
      console.log(response);
      if (!response.cancelled) {
        const source = {uri: response.uri};
        setImage(source);
        await detectObjects(source);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const renderPrediction = (prediction, index) => {
    const pclass = prediction.class;
    const score = prediction.score;
    const x = prediction.bbox[0];
    const y = prediction.bbox[1];
    const w = prediction.bbox[2];
    const h = prediction.bbox[3];

    return (
      <View style={styles.welcomeContainer}>
        <Text key={index} style={styles.text}>
          Prediction: {pclass} {', '} Probability: {score} {', '} Bbox: {x}{' '}
          {', '} {y} {', '} {w} {', '} {h}
        </Text>
      </View>
    );
  };
  useEffect(() => {
    const tfProcess = async () => {
      await tf.setBackend('rn-webgl');
      await tf.ready();
      // Signal to the app that tensorflow.js can now be used.
      setTfReady(true);
      const tfModel = await cocossd.load();
      setModel(tfModel);
      setModelReady(true);
    };
    tfProcess();
    const threshold = 0.9;

    // Load the model. Users optionally pass in a threshold and an array of
    // labels to include.
    toxicity.load(threshold).then(model => {
      const sentences = ['you suck'];

      model.classify(sentences).then(predictions => {
        // `predictions` is an array of objects, one for each prediction head,
        // that contains the raw probabilities for each input along with the
        // final prediction in `match` (either `true` or `false`).
        // If neither prediction exceeds the threshold, `match` is `null`.

        console.log(predictions);
        /*
        prints:
        {
          "label": "identity_attack",
          "results": [{
            "probabilities": [0.9659664034843445, 0.03403361141681671],
            "match": false
          }]
        },
        {
          "label": "insult",
          "results": [{
            "probabilities": [0.08124706149101257, 0.9187529683113098],
            "match": true
          }]
        },
        ...
         */
      });
    });
  }, []);
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text style={styles.text}>
            TensorFlow.js ready? {tfReady ? <Text>✅</Text> : ''}
          </Text>
        </View>
        <View style={styles.loadingModelContainer}>
          <Text style={styles.text}>COCO-SSD model ready? </Text>
          {modelReady ? (
            <Text style={styles.text}>✅</Text>
          ) : (
            <ActivityIndicator size="small" />
          )}
        </View>
        <TouchableOpacity
          style={styles.imageWrapper}
          onPress={modelReady ? selectImage : undefined}>
          {image && <Image source={image} style={styles.imageContainer} />}

          {modelReady && !image && (
            <Text style={styles.transparentText}>Tap to choose image</Text>
          )}
        </TouchableOpacity>
        <View style={styles.predictionWrapper}>
          {model && image && (
            <Text style={styles.text}>
              Predictions: {predictions ? '' : 'Detecting...'}
            </Text>
          )}

          {modelReady &&
            predictions &&
            predictions.map((p, index) => renderPrediction(p, index))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171f24',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  contentContainer: {
    paddingTop: 30,
  },
  loadingContainer: {
    marginTop: 80,
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
  },
  loadingModelContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    padding: 10,
    borderColor: '#cf667f',
    borderWidth: 5,
    borderStyle: 'dashed',
    marginTop: 40,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
  predictionWrapper: {
    height: 100,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  transparentText: {
    color: '#ffffff',
    opacity: 0.7,
  },
  footer: {
    marginTop: 40,
  },
  poweredBy: {
    fontSize: 20,
    color: '#e69e34',
    marginBottom: 6,
  },
  tfLogo: {
    width: 125,
    height: 70,
  },
});
export default App;
