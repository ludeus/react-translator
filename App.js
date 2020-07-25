import React from 'react';
import { Text, View, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { TRANSLATOR_URL } from './PrivateConstants';
import * as Localization from 'expo-localization';

export default class App extends React.Component {
    state = {
        hasPermission: null,
        cameraType: Camera.Constants.Type.back,
        loading: false,
        processingPhoto: false,
        submittingPhoto: false
    }

    async componentDidMount() {
        this.getPermissionAsync()
    }

    getPermissionAsync = async () => {
        // Camera roll Permission 
        if (Platform.OS === 'ios') {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
            }
        }
        // Camera Permission
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({ hasPermission: status === 'granted' });
    }

    handleCameraType = () => {
        const { cameraType } = this.state

        this.setState({
            cameraType:
                cameraType === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
        })
    }

    parseHtmlEntities(str) {
        return str.replace(/&#([0-9]{1,3});/gi, function (match, numStr) {
            var num = parseInt(numStr, 10); // read num as normal number
            return String.fromCharCode(num);
        });
    }

    takePicture = async () => {
        if (this.camera) {
            this.setState({ processingPhoto: true });
            this.camera.takePictureAsync({ quality: 0.1, base64: true })
                .then(photo => {
                    this.setState({ loading: true });
                    this.setState({ processingPhoto: false });
                    this.camera.pausePreview();
                    this.setState({ submittingPhoto: true });
                    return fetch(TRANSLATOR_URL + '/' + Localization.locale.substr(0, Localization.locale.indexOf('-')), {
                        method: 'POST',
                        timeout: 5000,
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            img64: photo.base64
                        })
                    });
                })
                .then(response => response.json())
                .then(json => {
                    this.setState({ submittingPhoto: false });
                    Alert.alert(
                        "Traduction",
                        this.parseHtmlEntities(json),
                        [
                            { text: "OK" }
                        ],
                        { cancelable: false }
                    );
                    this.camera.resumePreview();
                    this.setState({ loading: false });
                });
        }
    }

    pickImage = async () => {
        this.camera.pausePreview();
        this.setState({ loading: true });
        this.setState({ processingPhoto: true });
        ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true
        })
            .then(photo => {
                this.setState({ processingPhoto: false });
                this.setState({ submittingPhoto: true });
                return fetch(TRANSLATOR_URL + '/' + Localization.locale.substr(0, Localization.locale.indexOf('-')), {
                    method: 'POST',
                    timeout: 5000,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        img64: photo.base64
                    })
                });
            })
            .then(response => response.json())
            .then(json => {
                this.setState({ submittingPhoto: false });
                Alert.alert(
                    "Traduction",
                    this.parseHtmlEntities(json),
                    [
                        { text: "OK" }
                    ],
                    { cancelable: false }
                );
                this.camera.resumePreview();
                this.setState({ loading: false });
            });
    }

    render() {
        const { hasPermission } = this.state;
        if (hasPermission === null) {
            return <View />;
        } else if (hasPermission === false) {
            return <Text>No access to camera</Text>;
        } else {
            return (
                <View style={{ flex: 1 }}>
                    <View style={this.state.loading
                        ? {
                            flex: 1,
                            flexDirection: "row",
                            alignItems: 'center',
                            justifyContent: 'center'
                        }
                        : {display: 'none'}
                    }>
                        <ActivityIndicator size="large" color="#333333" />
                        <Text style={this.state.processingPhoto ? {} : { display: 'none' }}>Processing photo...</Text>
                        <Text style={this.state.submittingPhoto ? {} : { display: 'none' }}>Submiting photo...</Text>
                    </View>
                    <Camera style={this.state.loading ? { display: 'none' } : { flex: 1 }} type={this.state.cameraType} ref={ref => { this.camera = ref }}>
                        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", margin: 30 }}>
                            <TouchableOpacity
                                style={
                                    this.state.processingPhoto
                                        ? { display: 'none' }
                                        : {
                                            alignSelf: 'flex-end',
                                            alignItems: 'center',
                                            backgroundColor: 'transparent'
                                        }
                                    }
                                onPress={() => this.pickImage()}>
                                <Ionicons
                                    name="ios-photos"
                                    style={{ color: "#fff", fontSize: 40 }}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={
                                    this.state.processingPhoto
                                        ? { display: 'none' }
                                        : {
                                            alignSelf: 'flex-end',
                                            alignItems: 'center',
                                            backgroundColor: 'transparent'
                                        }
                                    }
                                onPress={() => this.takePicture()}
                            >
                                <FontAwesome
                                    name="camera"
                                    style={{ color: "#fff", fontSize: 40 }}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={
                                    this.state.processingPhoto
                                        ? { display: 'none' }
                                        : {
                                            alignSelf: 'flex-end',
                                            alignItems: 'center',
                                            backgroundColor: 'transparent'
                                        }
                                    }
                                onPress={() => this.handleCameraType()}
                            >
                                <MaterialCommunityIcons
                                    name="camera-switch"
                                    style={{ color: "#fff", fontSize: 40 }}
                                />
                            </TouchableOpacity>
                        </View>
                    </Camera>
               </View>
            );
        }
    }
}
