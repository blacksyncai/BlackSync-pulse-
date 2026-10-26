export const FAIR_TAG_SCRIPT = `
local epoch = redis.call('GET', KEYS[1]) or '0'
local virtualTime = tonumber(redis.call('ZSCORE', KEYS[2], 'v') or '0')
local tag = virtualTime
local clocks = {}

for i = 4, #KEYS do
  local raw = redis.call('GET', KEYS[i]) or ''
  local clockEpoch, clock = string.match(raw, '^(%d+):(.+)$')

  clocks[i] = virtualTime

  if clockEpoch == epoch and tonumber(clock) > virtualTime then
    clocks[i] = tonumber(clock)
  end

  if clocks[i] > tag then
    tag = clocks[i]
  end
end

local weight = 1

for i = 4, #KEYS do
  local keyWeight = tonumber(redis.call('HGET', KEYS[3], ARGV[i - 1]) or '1')

  if keyWeight > 0 then
    weight = weight * keyWeight
  end
end

for i = 4, #KEYS do
  redis.call('SET', KEYS[i], epoch .. ':' .. (clocks[i] + tonumber(ARGV[1]) / weight), 'PX', ARGV[2])
end

return {tostring(tag), tostring(weight)}
`;
