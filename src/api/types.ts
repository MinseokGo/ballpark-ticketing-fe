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
