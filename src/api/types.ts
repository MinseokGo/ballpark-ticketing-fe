export type SectionCreateRequest = {
  name: string
  grade: string
  price: number
}

export type SectionResponse = {
  id: number
  name: string
  grade: string
  price: number
}

export type SeatBulkCreateRequest = {
  rowCount: number
  seatsPerRow: number
}

export type SeatBulkCreateResponse = {
  sectionId: number
  createdCount: number
}

export type GameCreateRequest = {
  homeTeam: string
  awayTeam: string
  startAt: string
  ticketOpenAt: string
}

export type GameStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED'

export type GameResponse = {
  id: number
  homeTeam: string
  awayTeam: string
  startAt: string
  ticketOpenAt: string
  status: GameStatus
  gameSeatCount: number
  progress: GameProgress
  homeScore: number
  awayScore: number
  winner: Winner | null
}

/** 경기 진행 상태. 예매 상태(GameStatus)와 따로 간다. */
export type GameProgress = 'NOT_STARTED' | 'LIVE' | 'FINISHED' | 'CANCELLED'

export type Winner = 'HOME' | 'AWAY' | 'DRAW'

export type HalfInning = 'TOP' | 'BOTTOM'

/** 현재 진행 상태 스냅샷. seq는 마지막 이벤트 번호다. */
export type LiveStateResponse = {
  gameId: number
  progress: GameProgress
  inning: number | null
  half: HalfInning | null
  homeScore: number
  awayScore: number
  seq: number
}

/** SSE로 오는 이벤트 한 건. 점수와 이닝은 절대값이라 같은 이벤트를 두 번 받아도 괜찮다. */
export type LiveEventResponse = {
  gameId: number
  seq: number
  type: string
  inning: number | null
  half: HalfInning | null
  homeScore: number
  awayScore: number
  terminal: boolean
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type GameSummaryResponse = {
  id: number
  homeTeam: string
  awayTeam: string
  startAt: string
  status: GameStatus
  progress: GameProgress
  homeScore: number
  awayScore: number
  winner: Winner | null
}

export type SeatMapItemResponse = {
  gameSeatId: number
  seatId: number
  rowNo: number
  seatNo: number
  sectionId: number
  sectionName: string
  grade: string
  status: GameSeatStatus
}

export type GameSeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD'

export type SectionAvailabilityResponse = {
  sectionId: number
  name: string
  grade: string
  price: number
  totalSeats: number
  availableSeats: number
  heldSeats: number
  soldSeats: number
}

export type ReservationCreateRequest = {
  gameSeatIds: number[]
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export type ReservationResponse = {
  id: number
  userId: number
  gameId: number
  status: ReservationStatus
  totalPrice: number
  gameSeatIds: number[]
  createdAt: string
}

export type PaymentCreateRequest = {
  success: boolean
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'

export type PaymentResponse = {
  id: number
  reservationId: number
  amount: number
  status: PaymentStatus
  createdAt: string
}

export type FieldError = {
  field: string
  reason: string
}

/** RFC 9457 ProblemDetail. 백엔드 GlobalExceptionHandler가 모든 에러를 이 형식으로 내려준다. */
export type ProblemDetail = {
  type?: string
  title?: string
  status: number
  detail?: string
  instance?: string
  code?: string
  errors?: FieldError[]
}
