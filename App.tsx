import {
  createGroupChannelCreateFragment,
  createGroupChannelFragment,
  createGroupChannelListFragment,
  createGroupChannelSettingsFragment,
  createMessageSearchFragment,
  createNativeClipboardService,
  createNativeFileService,
  createNativeMediaService,
  createNativePlayerService,
  createNativeRecorderService,
  SendbirdUIKitContainer,
  useConnection,
  useSendbirdChat,
} from '@sendbird/uikit-react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import Video from 'react-native-video';
import * as DocumentPicker from 'react-native-document-picker';
import * as FileAccess from 'react-native-file-access';
import * as ImagePicker from 'react-native-image-picker';
import * as Permissions from 'react-native-permissions';
import * as CreateThumbnail from 'react-native-create-thumbnail';
import * as ImageResizer from '@bam.tech/react-native-image-resizer';
import * as AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {
  NavigationContainer,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useGroupChannel} from '@sendbird/uikit-chat-hooks';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Pressable, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import {MMKV} from 'react-native-mmkv';
import {Logger} from '@sendbird/uikit-utils';
import {GroupChannelHandler} from '@sendbird/chat/groupChannel';

Logger.setLogLevel('debug');

const mmkv = new MMKV();
const platformServices = {
  clipboard: createNativeClipboardService(Clipboard),
  notification: {} as any,
  file: createNativeFileService({
    imagePickerModule: ImagePicker,
    documentPickerModule: DocumentPicker,
    permissionModule: Permissions,
    fsModule: FileAccess,
    mediaLibraryModule: CameraRoll,
  }),
  media: createNativeMediaService({
    VideoComponent: Video,
    thumbnailModule: CreateThumbnail,
    imageResizerModule: ImageResizer,
  }),
  player: createNativePlayerService({
    audioRecorderModule: AudioRecorderPlayer,
    permissionModule: Permissions,
  }),
  recorder: createNativeRecorderService({
    audioRecorderModule: AudioRecorderPlayer,
    permissionModule: Permissions,
  }),
};

const GroupChannelListFragment = createGroupChannelListFragment();
const GroupChannelCreateFragment = createGroupChannelCreateFragment();
const GroupChannelFragment = createGroupChannelFragment();
const GroupChannelSettingsFragment = createGroupChannelSettingsFragment();
const MessageSearchFragment = createMessageSearchFragment();

const GroupChannelListScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <GroupChannelListFragment
      onPressCreateChannel={channelType => {
        // Navigate to GroupChannelCreate function.
        navigation.navigate('GroupChannelCreate', {channelType});
      }}
      onPressChannel={channel => {
        // Navigate to GroupChannel function.
        navigation.navigate('GroupChannel', {channelUrl: channel.url});
      }}
    />
  );
};

const GroupChannelCreateScreen = () => {
  const navigation = useNavigation<any>();
  const {params} = useRoute<any>();

  return (
    <GroupChannelCreateFragment
      channelType={params.channelType}
      onCreateChannel={async channel => {
        // Navigate to GroupChannel function.
        navigation.replace('GroupChannel', {channelUrl: channel.url});
      }}
      onPressHeaderLeft={() => {
        // Go back to the previous screen.
        navigation.goBack();
      }}
    />
  );
};

const GroupChannelScreen = () => {
  const navigation = useNavigation<any>();
  const {params} = useRoute<any>();

  const {sdk} = useSendbirdChat();
  const {channel} = useGroupChannel(sdk, params.channelUrl);

  useEffect(() => {
    const handler = new GroupChannelHandler();
    handler.onReactionUpdated = (eventChannel, reactionEvent) => {
      console.log('onReactionUpdated', eventChannel, reactionEvent);
    };

    sdk.groupChannel.addGroupChannelHandler('handler_id', handler);

    return () => {
      sdk.groupChannel.removeGroupChannelHandler('handler_id');
    };
  }, []);

  if (!channel) return null;

  return (
    <GroupChannelFragment
      channel={channel}
      onChannelDeleted={() => {
        // Navigate to GroupChannelList function.
        navigation.navigate('GroupChannelList');
      }}
      onPressHeaderLeft={() => {
        // Go back to the previous screen.
        navigation.goBack();
      }}
      onPressHeaderRight={() => {
        // Navigate to GroupChannelSettings function.
        navigation.navigate('GroupChannelSettings', {
          channelUrl: params.channelUrl,
        });
      }}
      searchItem={params.searchItem}
    />
  );
};
const GroupChannelSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const {params} = useRoute<any>();

  const {sdk} = useSendbirdChat();
  const {channel} = useGroupChannel(sdk, params.channelUrl);
  if (!channel) return null;

  return (
    <GroupChannelSettingsFragment
      channel={channel}
      onPressHeaderLeft={() => {
        // Navigate back
        navigation.goBack();
      }}
      onPressMenuModeration={() => {
        // Navigate to group channel moderation
      }}
      onPressMenuMembers={() => {
        // Navigate to group channel members
      }}
      onPressMenuSearchInChannel={() => {
        // Navigate to group channel search
        navigation.push('MessageSearch', params);
      }}
      onPressMenuLeaveChannel={() => {
        // Navigate to group channel list
      }}
      onPressMenuNotification={() => {
        // Navigate to group channel notifications
      }}
    />
  );
};

const MessageSearchScreen = () => {
  const navigation = useNavigation<any>();
  const {params} = useRoute<any>();

  const {sdk} = useSendbirdChat();

  const {channel} = useGroupChannel(sdk, params.channelUrl);
  if (!channel) return null;

  return (
    <MessageSearchFragment
      channel={channel}
      onPressHeaderLeft={() => navigation.goBack()}
      onPressSearchResultItem={({message, channel}) => {
        navigation.push('GroupChannel', {
          channelUrl: channel.url,
          searchItem: {startingPoint: message.createdAt},
        });
      }}
    />
  );
};

const RootStack = createNativeStackNavigator();
const Navigation = () => {
  const {currentUser} = useSendbirdChat();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!currentUser ? (
          <RootStack.Screen name={'SignIn'} component={SignInScreen} />
        ) : (
          <>
            <RootStack.Screen
              name={'GroupChannelList'}
              component={GroupChannelListScreen}
            />
            <RootStack.Screen
              name={'GroupChannelCreate'}
              component={GroupChannelCreateScreen}
            />
            <RootStack.Screen
              name={'GroupChannel'}
              component={GroupChannelScreen}
            />
            <RootStack.Screen
              name={'GroupChannelSettings'}
              component={GroupChannelSettingsScreen}
            />
            <RootStack.Screen
              name={'MessageSearch'}
              component={MessageSearchScreen}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const SignInScreen = () => {
  const {connect} = useConnection();

  const USER_ID = 'NEW_USER_ID';

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Pressable
        style={{
          width: 120,
          height: 30,
          backgroundColor: '#742DDD',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={async () => {
          await connect(USER_ID, {nickname: 'NICKNAME'});
        }}>
        <Text>{'Sign in'}</Text>
      </Pressable>
    </View>
  );
};

const App = () => {
  return (
    <SendbirdUIKitContainer
      appId={APP_ID}
      uikitOptions={{
        common: {
          enableUsingDefaultUserProfile: true,
        },
        groupChannel: {
          enableMention: true,
        },
        groupChannelSettings: {
          enableMessageSearch: true,
        },
      }}
      chatOptions={{
        localCacheStorage: mmkv,
        enableAutoPushTokenRegistration: false,
      }}
      userProfile={{
        onCreateChannel() {},
      }}
      platformServices={platformServices}>
      <Navigation />
    </SendbirdUIKitContainer>
  );
};

const APP_ID = '2D7B4CDB-932F-4082-9B09-A1153792DC8D';

export default App;
