import React from 'react';
import { props, t } from '../../../../.';

@props({
  name: t.maybe(t.String)
})
export default class Component extends React.Component {

  static defaultProps = {
    name: 'Giulio'
  }

  render() {
    return (
      <div>
        <p>{this.props.name}</p>
      </div>
    );
  }
}
