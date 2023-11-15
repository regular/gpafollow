With rqdelay=230, it currently takes 8 minutes to request all data

- we treat binId as implementation detail we dont care about. timestamp and interval gives as the same information in a more stadard format
- querying only the fields we care about for a given analysis does not help with getting higher values for count because there are less permutations. the number f permutations stays the same whether we query all fields or just one.
- ideally we would have the ability to query a half open time interval using gte and lt, but we only have gte and lte.
- we need to keep track of the timestamp included in the latest bin we received in otder to calculate the gte value for the next request.
- we probably do one request a day
