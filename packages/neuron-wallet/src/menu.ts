import { app, shell, Menu, MenuItem, MenuItemConstructorOptions, dialog, BrowserWindow } from 'electron'
import { Channel, Routes } from './utils/const'
import env from './env'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const options = {
  type: 'info',
  title: app.getName(),
  message: app.getName(),
  detail: app.getVersion(),
  buttons: ['OK'],
  cancelId: 0,
}

const menuTemplate = [
  {
    label: app.getName(),
    submenu: [
      {
        role: 'about',
        click: () => {
          dialog.showMessageBox(options)
        },
      },
      separator,
      {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click: (menuItem: MenuItem, browserWindow: BrowserWindow, event: Event) => {
          console.debug(`NavTo ${menuItem.label} ${event.target} ${browserWindow.webContents}`)
          browserWindow.webContents.send(Channel.NavTo, {
            status: 1,
            result: {
              router: Routes.Settings,
            },
          })
        },
      },
      separator,
      {
        role: 'quit',
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'cut',
      },
      {
        role: 'copy',
      },
      {
        role: 'paste',
      },
    ],
  },
  {
    role: 'windowMenu',
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Nervos',
        click: () => {
          shell.openExternal('https://www.nervos.org/')
        },
      },
      {
        label: 'Source Code',
        click: () => {
          shell.openExternal('https://github.com/nervosnetwork/neuron')
        },
      },
    ],
  },
]

if (env.isDevMode) {
  menuTemplate.push({
    label: 'Develop',
    submenu: [
      {
        role: 'reload',
      },
      {
        role: 'forceReload',
      },
      {
        role: 'toggleDevTools',
      },
    ],
  })
}

export default Menu.buildFromTemplate(menuTemplate)
