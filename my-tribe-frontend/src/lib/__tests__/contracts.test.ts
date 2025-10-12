import { describe, it, expect, beforeEach } from 'vitest'
import { CONTRACT_ADDRESSES } from '../web3'

describe('Contract Configuration', () => {
  it('should have all required contract addresses configured', () => {
    expect(CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY).toBeTruthy()
    expect(CONTRACT_ADDRESSES.LIQUIDITY_MIGRATOR).toBeTruthy()
    expect(CONTRACT_ADDRESSES.TRUST_TOKEN).toBeTruthy()
    expect(CONTRACT_ADDRESSES.TREASURY).toBeTruthy()
  })

  it('should have valid Ethereum addresses', () => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/

    expect(CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY).toMatch(addressRegex)
    expect(CONTRACT_ADDRESSES.LIQUIDITY_MIGRATOR).toMatch(addressRegex)
    expect(CONTRACT_ADDRESSES.TRUST_TOKEN).toMatch(addressRegex)
    expect(CONTRACT_ADDRESSES.TREASURY).toMatch(addressRegex)
  })

  it('should match the deployed contract addresses', () => {
    // These should match the addresses from the deployment
    expect(CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY).toBe('0x5b722EB235D413b0107Fff3819bcc3703db5a86E')
    expect(CONTRACT_ADDRESSES.LIQUIDITY_MIGRATOR).toBe('0x956578Eb413210231cCeDa522ee60C31a8d72F93')
    expect(CONTRACT_ADDRESSES.TRUST_TOKEN).toBe('0x956578Eb413210231cCeDa522ee60C31a8d72F93')
    expect(CONTRACT_ADDRESSES.TREASURY).toBe('0xD4F79436a2a69C70127570749dc39Ae5D5C0c646')
  })
})