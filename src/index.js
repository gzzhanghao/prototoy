import assign from 'object-assign';
import Layout from './Layout';
import ShadowElement from './ShadowElement';
import * as util from './util';

assign(Layout, { ShadowElement, assign }, util);

export default Layout;
