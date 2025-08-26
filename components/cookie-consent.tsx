'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Text, Flex, Box } from '@radix-ui/themes'
import { Cookie, X, Settings } from 'lucide-react'
import { setNsfwPreference } from '@/lib/userPreferences'

interface CookieConsentProps {
    onAccept?: () => void
    onReject?: () => void
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onReject }) => {
    const [show, setShow] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        // Check if user has already made a choice
        const consentGiven = localStorage.getItem('cookie_consent_given')
        if (!consentGiven) {
            setShow(true)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookie_consent_given', 'true')
        localStorage.setItem('cookie_consent_choice', 'accepted')
        setShow(false)
        onAccept?.()
    }

    const handleReject = () => {
        localStorage.setItem('cookie_consent_given', 'true')
        localStorage.setItem('cookie_consent_choice', 'rejected')
        // Clear any existing NSFW preference
        localStorage.removeItem('nsfw_enabled')
        // Remove cookie if it exists
        document.cookie = 'nsfw_enabled=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        setShow(false)
        onReject?.()
    }

    const handleAcceptNecessary = () => {
        localStorage.setItem('cookie_consent_given', 'true')
        localStorage.setItem('cookie_consent_choice', 'necessary_only')
        // Clear any existing NSFW preference since it's not necessary
        localStorage.removeItem('nsfw_enabled')
        document.cookie = 'nsfw_enabled=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
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
                            onClick={() => setShow(false)}
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
                            We use cookies to remember your NSFW content preference. This helps us show you appropriate content
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
                                    NSFW Preference Cookie Details:
                                </Text>
                                <Text size="2" style={{ color: '#94a3b8', lineHeight: '1.5' }}>
                                    • <strong>Purpose:</strong> Remembers if you want to view NSFW content<br />
                                    • <strong>Duration:</strong> 30 days<br />
                                    • <strong>Storage:</strong> Browser cookie and localStorage<br />
                                    • <strong>Data:</strong> Simple true/false preference only
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

            {/* Animation styles */}
            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </Box>
    )
}

export default CookieConsent