import * as React from 'react';
import { BottomNavigation } from 'react-native-paper';

import ActivityRoute from './activity';
import IndexRoute from './index';
import LeaderboardRoute from './leaderboard';
import RecordingRoute from './recording';
import SettingsRoute from './settings';

const MyComponent = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'index', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline'},
    { key: 'activity', title: 'Activity', focusedIcon: 'view-grid-plus', unfocusedIcon: 'view-grid-plus-outline', },
    { key: 'recording', title: 'Recordings', focusedIcon: 'database-search', unfocusedIcon: 'database-search-outline' },
    { key: 'leaderboard', title: 'Leaderboard', focusedIcon: 'list-box', unfocusedIcon: 'list-box-outline' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    index: IndexRoute,
    activity: ActivityRoute,
    recording: RecordingRoute,
    leaderboard: LeaderboardRoute,
    settings: SettingsRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default MyComponent;