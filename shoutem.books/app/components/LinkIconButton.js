import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import {
  Button,
  Icon,
} from '@shoutem/ui';
import { openURL } from 'shoutem.web-view';
import { CmsListScreen } from 'shoutem.cms';

class LinkIconButton extends PureComponent {
  static propTypes = {
    book: PropTypes.any,
    openURL: PropTypes.func,
  };

  render() {
    const { book, openURL } = this.props;

    if (book.buyUrl) {
      return (
        <Button
          styleName="tight clear md-gutter-left"
          onPress={() => openURL(book.buyUrl, book.title)}
        >
          <Icon name="cart" />
        </Button>
      );
    }

    return null;
  }
}

export const mapDispatchToProps = CmsListScreen.createMapDispatchToProps({
  openURL,
});

export default connect(undefined, mapDispatchToProps)(LinkIconButton);
