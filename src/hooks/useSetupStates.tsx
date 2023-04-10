import { MenuItem } from '@/components/shell'
import { UserContextAttributes } from '@/contexts/user'
import { ColorScheme } from '@mantine/core'
import { useState } from 'react'

export function useSetupStates() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light')

  const [user, setUser] = useState<UserContextAttributes | null>(null)
  const [completeGetUser, setCompleteGetUser] = useState(false)

  const [menu, setMenu] = useState<MenuItem[]>([])
  const [menuHeader, setMenuHeader] = useState<MenuItem[]>([])

  return {
    colorScheme,
    setColorScheme,
    user,
    setUser,
    completeGetUser,
    setCompleteGetUser,
    menu,
    setMenu,
    menuHeader,
    setMenuHeader
  }
}