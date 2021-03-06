import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Dimensions, ScrollView, Animated } from 'react-native';
import SideMenu from 'react-native-side-menu';
import { connect } from 'react-redux';

import {
  executeShortcut,
  getActiveShortcut,
  isShortcutVisible,
} from 'shoutem.application/redux';

import { connectStyle } from '@shoutem/theme';
import { Screen, Button, Icon, View } from '@shoutem/ui';

import DrawerItem from '../components/DrawerItem';
import { ScreenStack } from '../components/stacks';
import { ChildNavigationBar } from '../components/ui';
import {
  navigateBack,
  setActiveNavigationStack,
  RESET_TO_ROUTE,
} from '../redux/core';
import { ext } from '../const';
import { shortcutChildrenRequired } from '../helpers';
import { DRAWER_NAVIGATION_STACK } from '../redux';

const { width: windowWidth } = Dimensions.get('window');

export class Drawer extends PureComponent {
  static propTypes = {
    // Server props
    shortcut: PropTypes.object.isRequired,
    startingScreen: PropTypes.string,
    showText: PropTypes.bool,
    showIcon: PropTypes.bool,

    // Props from local state (connect)
    activeShortcut: PropTypes.object,
    navigationState: PropTypes.object,
    style: PropTypes.object,

    executeShortcut: PropTypes.func,
    setActiveNavigationStack: PropTypes.func,
    navigateBack: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);

    this.drawerItemPressed = this.drawerItemPressed.bind(this);
    this.renderDrawerItem = this.renderDrawerItem.bind(this);
    this.drawerStatusChanged = this.drawerStatusChanged.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.resolveAndUpdateLayoutWidth = this.resolveAndUpdateLayoutWidth.bind(this);

    this.state = {
      layoutWidth: windowWidth,
      isOpen: false,
    };
  }

  componentDidMount() {
    this.props.setActiveNavigationStack(DRAWER_NAVIGATION_STACK);

    const activeShortcut = this.getStartingShortcut();
    this.openShortcut(activeShortcut);
  }

  getStartingShortcut() {
    const { startingScreen, shortcut } = this.props;
    return _.find(shortcut.children, ['id', startingScreen]) || _.first(shortcut.children);
  }

  getNavbarProps() {
    const { navigationState } = this.props;

    if (navigationState.index > 0) {
      return { renderLeftComponent: undefined };
    }

    return {
      renderLeftComponent: sceneProps => (
        <View virtual styleName="container">
          <Button onPress={this.openMenu}>
            <Icon
              name="sidebar"
              animationName={sceneProps.navBarProps.animationName}
            />
          </Button>
        </View>
      ),
    };
  }

  resolveAndUpdateLayoutWidth({ nativeEvent: { layout: { width } } }) {
    this.setState({ layoutWidth: width });
  }

  calculateSideMenuWidth() {
    // Use theme visibleContentWidth or fallback design default value
    const visibleContentWidth = this.props.style.visibleContentWidth || 54;
    return this.state.layoutWidth - visibleContentWidth;
  }

  openMenu() {
    this.setState({ isOpen: true });
  }

  drawerItemPressed(shortcut) {
    this.setState({ isOpen: !this.state.isOpen }, () => this.openShortcut(shortcut));
  }

  drawerStatusChanged(isOpen) {
    this.setState({ isOpen });
  }

  openShortcut(shortcut) {
    const { activeShortcut } = this.props;

    if (activeShortcut !== shortcut) {
      this.props.executeShortcut(
        shortcut.id,
        RESET_TO_ROUTE,
        DRAWER_NAVIGATION_STACK,
      );
    }
  }

  /**
   * Returns an animation used when closing the drawer, we are
   * implementing it here because we want to use native animation
   * driver for this animation.
   *
   * @param prop The prop to animate.
   * @param value The final value of the animation.
   * @returns {CompositeAnimation} The animation config.
   */
  drawerAnimationFunction(prop, value) {
    return Animated.spring(
      prop,
      {
        toValue: value,
        friction: 8,
        useNativeDriver: true,
      }
    );
  }

  renderMenu(shortcuts, style) {
    return (
      <ScrollView
        contentContainerStyle={style.menu}
        alwaysBounceVertical={false}
      >
        <View style={style.menuItems} styleName="flexible">
          {shortcuts.map(this.renderDrawerItem)}
        </View>
      </ScrollView>
    );
  }

  renderDrawerItem(shortcut) {
    const { activeShortcut, showText, showIcon } = this.props;
    return (
      <DrawerItem
        key={`drawer-item-${shortcut.id}`}
        showText={showText}
        showIcon={showIcon}
        shortcut={shortcut}
        onPress={this.drawerItemPressed}
        selected={activeShortcut.id === shortcut.id}
      />
    );
  }

  render() {
    const { isOpen } = this.state;
    const { activeShortcut, shortcut, style } = this.props;

    if (!activeShortcut) {
      return null;
    }

    const menu = this.renderMenu(shortcut.children, style);

    return (
      <Screen styleName="paper" onLayout={this.resolveAndUpdateLayoutWidth}>
        <ChildNavigationBar {...this.getNavbarProps()} />
        <SideMenu
          menu={menu}
          isOpen={isOpen}
          openMenuOffset={this.calculateSideMenuWidth()}
          onChange={this.drawerStatusChanged}
          animationFunction={this.drawerAnimationFunction}
        >
          <View styleName="flexible" style={style.underlayScreensWrapper}>
            <ScreenStack
              navigationState={this.props.navigationState}
              onNavigateBack={this.props.navigateBack}
              style={this.props.style.screenStack}
            />
          </View>
        </SideMenu>
      </Screen>
    );
  }
}

const mapStateToProps = state => ({
  activeShortcut: getActiveShortcut(state),
  navigationState: state[ext()].drawer,
  isShortcutVisible: (shortcutId) => isShortcutVisible(state, shortcutId),
});

const mapDispatchToProps = { navigateBack, setActiveNavigationStack, executeShortcut };

export default shortcutChildrenRequired(
  connect(mapStateToProps, mapDispatchToProps)(connectStyle(ext('Drawer'))(Drawer))
);
