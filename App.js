import React from "react";
import {
  Button,
  Image,
  StyleSheet,
  Text,
  ScrollView,
  View,
  Dimensions,
} from "react-native";
import * as Permissions from "expo-permissions";
import * as ImagePicker from "expo-image-picker";
import uuid from "uuid";
import Environment from "./config/environment";
import firebase from "./config/firebase";
import ImgToBase64 from "react-native-image-base64";
import * as FileSystem from "expo-file-system";

export default class App extends React.Component {
  state = {
    image: null,
    uploading: false,
    googleResponse: null,
    imgWidth: 0,
    imgHeight: 0,
  };

  async componentDidMount() {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    await Permissions.askAsync(Permissions.CAMERA);
  }

  render() {
    let { image, uploading } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.helpContainer}>
            <Button onPress={this._pickImage} title="Fotoğraf Seç" />

            <Button onPress={this._takePhoto} title="Fotoğraf Çek" />

            {uploading && <Text>Yükleniyor..</Text>}

            {this._maybeRenderImage()}
          </View>
        </ScrollView>
      </View>
    );
  }

  _maybeRenderImage = () => {
    let { image, googleResponse, imgWidth, imgHeight } = this.state;

    if (!image) {
      return;
    }

    return (
      <View
        style={{
          position: "relative",
        }}
      >
        <Image
          source={{ uri: image }}
          style={{ width: imgWidth, height: imgHeight, zIndex: 9 }}
        />
        {this.state.googleResponse &&
          this.state.googleResponse.responses[0].localizedObjectAnnotations !=
            undefined &&
          this.state.googleResponse.responses[0].localizedObjectAnnotations.map(
            (r) => (
              <View
                style={{
                  position: "absolute",
                  top:
                    r.boundingPoly.normalizedVertices[0].y *
                    this.state.imgHeight,
                  left:
                    r.boundingPoly.normalizedVertices[0].x *
                    this.state.imgWidth,
                  height:
                    (r.boundingPoly.normalizedVertices[2].y -
                      r.boundingPoly.normalizedVertices[0].y) *
                    this.state.imgHeight,
                  width:
                    (r.boundingPoly.normalizedVertices[1].x -
                      r.boundingPoly.normalizedVertices[0].x) *
                    this.state.imgWidth,
                  borderWidth: 1,
                  borderColor: "#ff0000",
                  zIndex: 99,
                }}
              >
                <Text
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    backgroundColor: "#ff0000",
                    color: "#fff",
                    fontSize: 9,
                  }}
                >
                  {r.name}
                </Text>
              </View>
            )
          )}
        {this.state.googleResponse &&
          this.state.googleResponse.responses[0].localizedObjectAnnotations !=
            undefined && (
            <Text style={{ textAlign: "center" }}>
              Obje sayısı:
              {
                this.state.googleResponse.responses[0]
                  .localizedObjectAnnotations.length
              }
            </Text>
          )}
      </View>
    );
  };

  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    this._handleImagePicked(pickerResult);
  };

  _handleImagePicked = async (pickerResult) => {
    try {
      this.setState({ uploading: true });

      if (!pickerResult.cancelled) {
        uploadUrl = await uploadImageAsync(pickerResult.uri);
        Image.getSize(uploadUrl, (width, height) => {
          const screenWidth = Dimensions.get("window").width;
          const scaleFactor = width / screenWidth;
          const imageHeight = height / scaleFactor;
          this.setState({
            imgWidth: screenWidth,
            imgHeight: imageHeight,
            image: uploadUrl,
          });
        });
        const base64 = await FileSystem.readAsStringAsync(pickerResult.uri, {
          encoding: "base64",
        });
        let body = JSON.stringify({
          requests: [
            {
              features: [{ type: "OBJECT_LOCALIZATION", maxResults: 10 }],
              image: {
                content: base64,
              },
            },
          ],
        });
        let response = await fetch(
          "https://vision.googleapis.com/v1/images:annotate?key=" +
            Environment["GOOGLE_CLOUD_VISION_API_KEY"],
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            method: "POST",
            body: body,
          }
        );
        let responseJson = await response.json();
        console.log(responseJson);
        this.setState({
          googleResponse: responseJson,
          uploading: false,
        });
      }
    } catch (e) {
      console.log(e);
      alert("Upload failed, sorry :(");
    } finally {
      this.setState({ uploading: false });
    }
  };
}

async function uploadImageAsync(uri) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.log(e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  const ref = firebase.storage().ref().child(uuid.v4());
  const snapshot = await ref.put(blob);

  blob.close();

  return await snapshot.ref.getDownloadURL();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 10,
  },
  developmentModeText: {
    marginBottom: 20,
    color: "rgba(0,0,0,0.4)",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
  contentContainer: {
    paddingTop: 30,
  },

  getStartedContainer: {
    alignItems: "center",
    marginHorizontal: 50,
  },

  getStartedText: {
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    lineHeight: 24,
    textAlign: "center",
  },

  helpContainer: {
    marginTop: 15,
    alignItems: "center",
  },
});
