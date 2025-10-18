export const USER_ID_QUERY = `{ user { id login } }`;

export const ROOT_EVENT_QUERY = `
  query GetRootEventId($userId: Int!) {
    event_user(
      where: {
        userId: { _eq: $userId }
        event: { parentId: { _is_null: true }, path: { _eq: "/bahrain/bh-module" } }
      }
    ) {
      event { id }
      createdAt
    }
  }
`;

export const DASHBOARD_QUERY = `
  query DashboardData($userId: Int!, $rootEventId: Int!) {
    user(where: { id: { _eq: $userId } }) {
      id
      login
      firstName
      lastName
      profile
      attrs
      campus
      createdAt
    }
    level: transaction(
      limit: 1
      order_by: { amount: desc }
      where: { userId: { _eq: $userId }, type: { _eq: "level" }, eventId: { _eq: $rootEventId } }
    ) { amount }
    totalUp: transaction_aggregate(where: { userId: { _eq: $userId }, type: { _eq: "up" } }) {
      aggregate { sum { amount } }
    }
    totalDown: transaction_aggregate(where: { userId: { _eq: $userId }, type: { _eq: "down" } }) {
      aggregate { sum { amount } }
    }
    totalXp: transaction_aggregate(
      where: { userId: { _eq: $userId }, type: { _eq: "xp" }, eventId: { _eq: $rootEventId } }
    ) {
      aggregate { sum { amount } }
    }
    cohort: label_user(where: { userId: { _eq: $userId } }, limit: 1) { labelName }
    transactions: transaction(
      where: { userId: { _eq: $userId }, type: { _in: ["xp", "up", "down"] } }
      order_by: { createdAt: desc }
    ) {
      id
      type
      amount
      createdAt
      object { name }
    }
    currentProject: group_user(
      where: { userId: { _eq: $userId }, group: { status: { _eq: working } } }
      limit: 1
    ) {
      group { object { name type } status path }
    }
  }
`;

export const PENDING_AUDITS_QUERY = `
  query PendingAuditsQuery($auditorId: Int!) {
    audit(
      where: { 
        auditorId: { _eq: $auditorId },
        group: { status: { _eq: audit } }, 
        closedAt: { _is_null: true }
      }
      order_by: { createdAt: desc }
    ) {
      id
      grade
      createdAt
      attrs
      auditorLogin 
      closedAt
        private { 
        code 
      }
      group {
        id
        status
        captainLogin
        object {
          id
          name
          type
        }
      }
    }
  }
`;