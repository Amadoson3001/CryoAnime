import { Calendar, Clock, Info } from 'lucide-react'
import { Suspense } from 'react'
import { Badge, Box, Container, Flex, Grid, Heading, Text } from '@/components/ui-primitives'
import { AnimeCard } from '@/components/anime_cards'
import { getCurrentSeasonInfo, getUtcWeekStart, getWeeklySchedule } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'
import { firstQueryValue, type QueryParams } from '@/lib/query'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const requestedWeek = (value: string | undefined): Date => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return getUtcWeekStart()
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return getUtcWeekStart()
  return getUtcWeekStart(parsed)
}

async function ScheduleContent({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  const params = await searchParams || {}
  const weekStart = requestedWeek(firstQueryValue(params.week))
  const schedule = await getWeeklySchedule(weekStart, await readContentPreferences()).catch(() => null)
  const seasonInfo = getCurrentSeasonInfo()
  const currentWeek = getUtcWeekStart()
  const today = new Date()
  const featuredDay = weekStart.getTime() === currentWeek.getTime()
    ? DAYS[(today.getUTCDay() + 6) % 7]
    : DAYS[0]
  const featuredIndex = DAYS.indexOf(featuredDay)
  const orderedDays = [...DAYS.slice(featuredIndex), ...DAYS.slice(0, featuredIndex)]
  return (
    <main className="page-shell">
      <Container size="4" px="3" py={{ initial: '7', md: '9' }}>
        <Box mb="8" style={{ textAlign: 'center' }}>
          <Flex align="center" justify="center" gap="3"><Calendar size={32} style={{ color: '#3b82f6' }} aria-hidden="true" /><h1 className="page-title">Anime Schedule</h1><Calendar size={32} style={{ color: '#3b82f6' }} aria-hidden="true" /></Flex>
          <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '680px', margin: '0.75rem auto 0' }}>Anime schedule for the requested UTC week.</Text>
          <Text as="p" size="2" mt="2" style={{ color: '#94a3b8' }}><Clock size={14} aria-hidden="true" /> Week of {weekStart.toISOString().slice(0, 10)}</Text>
        </Box>
        <Box mb="6" style={{ textAlign: 'center' }}>
          <Flex align="center" justify="center" gap="2" mb="2">
            <Info size={20} style={{ color: '#3b82f6' }} aria-hidden="true" />
            <Text as="p" size="3" style={{ color: '#cbd5e1' }}>Current Season: {seasonInfo.displayName} {seasonInfo.year}</Text>
          </Flex>
        </Box>
        {!schedule ? <Box className="empty-state"><Text as="p">The airing schedule is temporarily unavailable. Please try again.</Text></Box> : (
          <Box mb="8">
            <Box mb="6" style={{ textAlign: 'center' }}>
              <Heading as="h2" size="6" style={{ color: 'white' }}>Weekly Schedule</Heading>
              <Text as="p" size="3" style={{ color: '#cbd5e1' }}>Anime airing throughout the week</Text>
            </Box>
          <Flex direction="column" gap="8" className="schedule-sections">
            {orderedDays.map(day => (
              day === featuredDay ? (
                <Box key={day} className="schedule-day schedule-featured-day" aria-labelledby={`schedule-${day}`}>
                  <Flex align="center" gap="3" mb="4"><Heading id={`schedule-${day}`} as="h2" size="7" style={{ color: 'white', fontWeight: 'bold' }}>Airing Today</Heading><Calendar size={36} style={{ color: '#3b82f6' }} aria-hidden="true" /></Flex>
                  <Text as="p" size="5" mb="8" style={{ color: '#cbd5e1', maxWidth: '600px' }}>Fresh episodes from your favorite shows are dropping today.</Text>
                  {schedule[day].length === 0 ? <Box className="schedule-empty"><Text as="p" size="4" style={{ color: '#cbd5e1' }}>No anime scheduled for today.</Text></Box> : <Grid columns={{ initial: '2', md: '3', lg: '4' }} gap="6" className="schedule-featured-grid">{schedule[day].map((anime, index) => <Box key={anime.mal_id}><AnimeCard anime={anime} priority={index < 2} /></Box>)}</Grid>}
                </Box>
              ) : (
                <Box key={day} className="schedule-day" aria-labelledby={`schedule-${day}`}>
                  <Flex align="center" gap="3" mb="4"><Heading id={`schedule-${day}`} as="h3" size="5" style={{ color: 'white' }}>{day[0].toUpperCase() + day.slice(1)}</Heading><Badge variant="soft" style={{ backgroundColor: '#3b82f6', color: 'white' }}>{schedule[day].length} anime</Badge></Flex>
                  {schedule[day].length === 0 ? <Box className="schedule-empty"><Text as="p" size="3" style={{ color: '#64748b' }}>No anime scheduled for {day}.</Text></Box> : <Box className="schedule-scroll"><Flex gap="4" className="schedule-row">{schedule[day].map(anime => <Box key={anime.mal_id} className="schedule-card"><AnimeCard anime={anime} priority={false} /></Box>)}</Flex></Box>}
                </Box>
              )
            ))}
          </Flex>
          </Box>
        )}
      </Container>
    </main>
  )
}

export default function SchedulePage({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  return <Suspense fallback={<ScheduleFallback />}><ScheduleContent searchParams={searchParams} /></Suspense>
}

function ScheduleFallback() {
  return <main className="page-shell"><Container size="4" px="3" py={{ initial: '7', md: '9' }}><Box className="schedule-loading"><Clock size={32} style={{ color: '#3b82f6' }} aria-hidden="true" /><Heading as="h2" size="6" style={{ color: 'white' }}>Loading Anime Schedule</Heading><Text as="p" size="4" style={{ color: '#cbd5e1' }}>Please wait while we fetch the latest schedule…</Text><div className="loading-progress"><span /></div></Box></Container></main>
}
