<?php
/**
 * Plugin name: Customizer Dev Tools
 * Description: Log out the console the changes to settings in the Customizer. Useful for developers and debugging.
 * Author: Weston Ruter, XWP
 * Plugin URL: https://gist.github.com/westonruter/1016332b18ee7946dec3
 * Version: 0.1
 * Author: XWP
 * Author URI: https://xwp.co/
 * License: GPLv2+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 *
 * Copyright (c) 2016 XWP (https://xwp.co/)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or, at
 * your discretion, any later version, as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * @package CustomizerDevTools
 */

// @todo Log customizer events (we can hijack the wp.customize.Events interface).
// @todo Log addition of new panels, sections, controls, settings.
// @todo Log changes to settings.
// @todo Log changes to UI constructs (expanded, active).
// @todo Log changes to previewedDevice
// @todo Log changes to previewUrl
// @todo Log changes to models in preview as well as pane (especially selective refresh).
// @todo Only enable logger if WP_DEBUG is on? Allow customizing which messages get console-logged out?

namespace CustomizerDevTools;

require_once __DIR__ . '/php/class-plugin.php';

global $customizer_dev_tools_plugin;
$customizer_dev_tools_plugin = new Plugin();
add_action( 'plugins_loaded', array( $customizer_dev_tools_plugin, 'init' ) );
