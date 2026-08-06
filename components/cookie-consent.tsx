'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Text, Flex, Box } from '@/components/ui-primitives'
import { Cookie, X, Settings } from 'lucide-react'
import { DEFAULT_CONTENT_PREFERENCES } from '@/lib/contentRatings'
import { useContentPreferences } from '@/components/content-preference-provider'

interface CookieConsentProps {
    onAccept?: () => void
    onReject?: () => void
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onReject }) => {
    const [show, setShow] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const { setPreferences } = useContentPreferences()

    useEffect(() => {
        // Check if user has already made a choice
        let consentGiven: string | null = null
        try {
            consentGiven = localStorage.getItem('cookie_consent_given')
        } catch {
            // Show the prompt when storage is unavailable so the user can still
            // make a choice for this session.
        }
        if (!consentGiven) {
            setShow(true)
        }
    }, [])

    const persistConsent = (choice: string) => {
        try {
            localStorage.setItem('cookie_consent_given', 'true')
            localStorage.setItem('cookie_consent_choice', choice)
        } catch {
            // Consent is still applied for the current render when storage is blocked.
        }
    }

    const handleAccept = () => {
        persistConsent('accepted')
        setShow(false)
        onAccept?.()
    }

    const handleReject = () => {
        persistConsent('rejected')
        setPreferences(DEFAULT_CONTENT_PREFERENCES)
        setShow(false)
        onReject?.()
    }

    const handleAcceptNecessary = () => {
        persistConsent('necessary_only')
        setPreferences(DEFAULT_CONTENT_PREFERENCES)
        setShow(false)
    }

    if (!show) return null

    return (
        <Box
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                zIndex: 1000,
                maxWidth: '600px',
                margin: '0 auto'
            }}
        >
            <Card
                style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #3b82f6',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    animation: 'slideUp 0.3s ease-out'
                }}
            >
                <Flex direction="column" gap="4">
                    {/* Header */}
                    <Flex align="center" gap="3">
                        <Cookie size={24} style={{ color: '#3b82f6' }} />
                        <Text size="5" weight="bold" style={{ color: 'white' }}>
                            Cookie Preferences
                        </Text>
                        <Button
                            variant="ghost"
                            size="2"
                            onClick={() => {
                                persistConsent('dismissed')
                                setShow(false)
                            }}
                            style={{
                                marginLeft: 'auto',
                                color: '#94a3b8',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={16} />
                        </Button>
                    </Flex>

                    {/* Content */}
                    <Box>
                        <Text size="3" style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1rem' }}>
                            We use cookies to remember your Mature and Explicit content preferences. This helps us show you appropriate content
                            based on your choice. No personal data is collected or shared.
                        </Text>

                        {showDetails && (
                            <Box
                                style={{
                                    backgroundColor: '#0f172a',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    border: '1px solid #334155'
                                }}
                            >
                                <Text size="3" weight="bold" style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>
                                    Content Preference Cookie Details:
                                </Text>
                                <Text size="2" style={{ color: '#94a3b8', lineHeight: '1.5' }}>
                                    • <strong>Purpose:</strong> Remembers whether Mature or Explicit content is visible<br />
                                    • <strong>Duration:</strong> 30 days<br />
                                    • <strong>Storage:</strong> Secure functional cookie; consent choice stays local-only<br />
                                    • <strong>Data:</strong> Two simple true/false preferences only
                                </Text>
                            </Box>
                        )}
                    </Box>

                    {/* Buttons */}
                    <Flex gap="3" wrap="wrap">
                        <Button
                            size="2"
                            onClick={handleAccept}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                cursor: 'pointer',
                                flex: '1'
                            }}
                        >
                            Accept All
                        </Button>
                        <Button
                            size="2"
                            variant="outline"
                            onClick={handleAcceptNecessary}
                            style={{
                                borderColor: '#60a5fa',
                                color: '#60a5fa',
                                cursor: 'pointer',
                                flex: '1'
                            }}
                        >
                            Necessary Only
                        </Button>
                        <Button
                            size="2"
                            variant="ghost"
                            onClick={handleReject}
                            style={{
                                color: '#94a3b8',
                                cursor: 'pointer'
                            }}
                        >
                            Reject All
                        </Button>
                        <Button
                            size="2"
                            variant="ghost"
                            onClick={() => setShowDetails(!showDetails)}
                            style={{
                                color: '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}
                        >
                            <Settings size={14} />
                            {showDetails ? 'Less' : 'More'} Info
                        </Button>
                    </Flex>

                    {/* Links */}
                    <Flex gap="4" justify="center">
                        <a
                            href="/privacy"
                            style={{
                                color: '#60a5fa',
                                textDecoration: 'none',
                                fontSize: 'var(--font-size-2)',
                                cursor: 'pointer'
                            }}
                        >
                            Privacy Policy
                        </a>
                    </Flex>
                </Flex>
            </Card>
        </Box>
    )
}

export default CookieConsent
