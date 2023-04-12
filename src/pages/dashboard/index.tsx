import { UserContext } from '@/contexts/user'
import { f } from '@/lib/fetch'
import { Button, Col, Container, Drawer, Grid, Group, Modal, NumberInput, PasswordInput, Select, Switch, Tabs, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { showNotification } from '@mantine/notifications'
import { Service } from '@prisma/client'
import totp from 'totp-generator'
import parseURI from 'otpauth-uri-parser'
import { useCallback, useContext, useEffect, useState } from 'react'
import QrReader from 'react-qr-scanner'

interface CreateForm {
  url: string,
  username?: string,
  password?: string,
  name?: string,
  secret?: string,
  digits?: number,
  period?: number,
  algorithm?: string,
  uri?: string
}

export default function Dashboard() {
  const { user } = useContext(UserContext)
  const [services, setServices] = useState<Service[]>([])
  const [opened, setOpened] = useState<boolean>(false)
  const [toggleQR, setToggleQR] = useState<boolean>(true)
  const [urlData, setUrlData] = useState<{ label: string, value: string }[]>([])
  const [tabCreate, setTabCreate] = useState<'password' | 'authenticator'>('password')
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>()
  const [camDeviceId, setCamDeviceId] = useState<string | null>(null)
  const [openService, setOpenService] = useState<Service>()
  const [totp, setTotp] = useState<string>()
  const [remaining, setRemaining] = useState<number>(0)
  const [filters, setFilters] = useState<{
    skip: number,
    take: number,
    orderBy: `${string}:${'desc' | 'asc'}`,
    search: Record<string, any>
  }>({
    skip: 0,
    take: 0,
    orderBy: 'url:asc',
    search: {}
  })
  const createForm = useForm({
    initialValues: {
      url: '',
      username: '',
      password: '',
      name: '',
      secret: '',
      digits: 6,
      period: 30,
      algorithm: 'SHA-1'
    }
  })

  const fetchAll = useCallback(async () => {
    if (user) {
      try {
        const { services } = await f.post(`/api/services?${
          new URLSearchParams({
            _skip: filters.skip.toString(),
            _take: filters.take.toString(),
            _orderBy: filters.orderBy
          })}`, { _search: filters.search }, {
          'x-device-id': localStorage.getItem(`deviceId:${user?.id}`) || ''
        })
        setServices(services)
        if (filters.skip === 0 && filters.take === 0) {
          setUrlData((services as Service[]).map(s => ({ label: s.url, value: s.id })))
        }
      } catch (error: any) {
        showNotification({
          title: 'Error',
          message: error.message,
          color: 'red',
        })
      }
    }
  }, [user, filters])

  const create = async (data: CreateForm) => {
    try {
      let serviceId: string = data.url

      if (!serviceId) {
        const { service } = await f.post('/api/services', {
          url: data.url,
        }, {
          'x-device-id': localStorage.getItem(`deviceId:${user?.id}`) || ''
        })
        serviceId = service.id
      }

      if (data.username || data.password) {
        await f.post(`/api/services/${serviceId}/passwords`, {
          username: data.username,
          password: data.password
        }, {
          'x-device-id': localStorage.getItem(`deviceId:${user?.id}`) || ''
        })
      }
      if (data.secret) {
        await f.post(`/api/services/${serviceId}/authenticators`, {
          name: data.name || new URL(data.url).host,
          secret: data.secret,
          digits: data.digits,
          period: data.period,
          algorithm: data.algorithm
        }, {
          'x-device-id': localStorage.getItem(`deviceId:${user?.id}`) || ''
        })
      }

      fetchAll()
      setOpened(false)
      createForm.reset()
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message,
        color: 'red',
      })
    }
  }

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (toggleQR) {
      window.navigator.mediaDevices.enumerateDevices().then(devices => {
        const cams = devices.filter(device => device.kind === 'videoinput' && device.deviceId)
        setCamDevices(cams)
        setCamDeviceId(cams[0]?.deviceId)
      })
    }
  }, [toggleQR])

  useEffect(() => {
    if (openService) {

    }
  }, [openService])

  return <Container fluid>
    <Grid>
      <Col span={12} lg={6} md={8} sm={10}>
        <Group position="apart" mb="lg">
          <Title order={2}>
            Your Credentials
          </Title>
          <Button size="sm" color="blue" variant="light" onClick={() => setOpened(true)}>
            Create
          </Button>
        </Group>
      </Col>
    </Grid>

    <Drawer
      position="right"
      opened={opened}
      onClose={() => setOpened(false)}
      title="Create a new credential">
      <form onSubmit={createForm.onSubmit(create)}>
        <Select
          label="URL"
          data={urlData}
          required
          withAsterisk
          searchable
          creatable
          getCreateLabel={(query) => `+ Create new ${query}`}
          onCreate={(query) => {
            const v = { label: query, value: '' }
            setUrlData(data => [...data, v])
            return v
          }}
          {...createForm.getInputProps('url')} />
        <Tabs mt="md" value={tabCreate} onTabChange={e => setTabCreate(e as 'password' | 'authenticator')}>
          <Tabs.List>
            <Tabs.Tab value="password">Password</Tabs.Tab>
            <Tabs.Tab value="authenticator">Authenticator</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="password">
            <TextInput
              mt="md"
              label="Username"
              {...createForm.getInputProps('username')}
            />
            <PasswordInput
              mt="md"
              label="Password"
              type="password"
              {...createForm.getInputProps('password')}
            />
          </Tabs.Panel>
          <Tabs.Panel value="authenticator">
            {toggleQR ? <>
              {camDevices?.length ? <Select
                my="md"
                data={camDevices.map(c => ({ value: c.deviceId, label: c.label }))}
                value={camDeviceId}
                onChange={setCamDeviceId} /> : <></>}
              {tabCreate === 'authenticator' ? <QrReader
                constraints={{ video: camDeviceId ? { deviceId: camDeviceId } : { facingMode: { ideal: 'environment' } } }}
                style={{ width: '100%'}}
                onError={e => showNotification({
                  title: 'Error',
                  message: e.message,
                  color: 'red'
                })}
                onScan={async data => {
                  if (data?.text) {
                    try {
                      const parsed = parseURI(data.text)
                      if (parsed.type === 'totp') {
                        createForm.setValues({
                          name: `${parsed.label.issuer}${
                            parsed.label.account ? `: ${parsed.label.account}` : ''}`,
                          secret: parsed.query.secret,
                          digits: Number(parsed.query.digits) || 6,
                          period: Number(parsed.query.period) || 30,
                          algorithm: parsed.query.algorithm || 'SHA-1'
                        })
                        setToggleQR(false)
                      }
                    } catch (error) {
                      // ignore
                    }
                  }
                }} /> : <></>}
            </> : <>
              <TextInput
                mt="md"
                label="Name"
                {...createForm.getInputProps('name')}
              />
              <TextInput
                mt="md"
                label="Secret"
                {...createForm.getInputProps('secret')}
              />
              <NumberInput
                mt="md"
                label="Digits"
                {...createForm.getInputProps('digits')}
              />
              <NumberInput
                mt="md"
                label="Period"
                {...createForm.getInputProps('period')}
              />
              {/* <Select
                mt="md"
                data={[
                  'SHA-1', 'SHA-224', 'SHA-256', 'SHA-384',
                  'SHA-512', 'SHA3-224', 'SHA3-256',
                  'SHA3-384', 'SHA3-512']}
                label="Algorithm"
                {...createForm.getInputProps('algorithm')}
              /> */}
            </>}
            <Switch
              mt="md"
              checked={toggleQR}
              onChange={({ target: { checked } }) => setToggleQR(checked)}
              label={toggleQR ? 'Switch to input secret' : 'Switch to QR scanner'} />
          </Tabs.Panel>
        </Tabs>

        <Group position="right" mt="lg">
          <Button type="submit" variant="light">
            Save
          </Button>
        </Group>
      </form>
    </Drawer>

    <Drawer
      position="right"
      opened={Boolean(openService)}
      onClose={() => setOpenService(undefined)}
      title={openService?.url}>
    </Drawer>
  </Container>
}