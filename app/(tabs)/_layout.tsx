import * as React from 'react';
import { BottomNavigation } from 'react-native-paper';

import AccountRoute from './account';
import ActivityRoute from './activity';
import IndexRoute from './index';
import LeaderboardRoute from './leaderboard';

const MyComponent = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'index', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline'},
    { key: 'activity', title: 'Activity', focusedIcon: 'view-grid-plus', unfocusedIcon: 'view-grid-plus-outline', },
    { key: 'leaderboard', title: 'Leaderboard', focusedIcon: 'list-box', unfocusedIcon: 'list-box-outline' },
    { key: 'account', title: 'Account', focusedIcon: 'account-circle', unfocusedIcon: 'account-circle-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    index: IndexRoute,
    activity: ActivityRoute,
    leaderboard: LeaderboardRoute,
    account: AccountRoute,
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