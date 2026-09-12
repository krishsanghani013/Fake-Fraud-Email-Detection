async function testApi() {
  const dynamicSample = {
    sender: 'security@dynamic-test-domain.org',
    subject: 'URGENT: Suspicious Login Attempt Detected on Cloud Infrastructure',
    body: 'Hello Administrator, We noticed a login to your production cluster from an unrecognized IP in Eastern Europe. Please review access logs immediately at https://dynamic-test-domain.org/verify-session to prevent account termination.',
    riskScore: 89,
    classification: 'PHISHING',
    explanation: 'High confidence phishing lure impersonating cloud infrastructure security. Unaligned sender domain with immediate credential harvesting call-to-action.'
  };

  try {
    console.log('1. Testing POST http://localhost:3000/api/emails ...');
    const postRes = await fetch('http://localhost:3000/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dynamicSample)
    });

    console.log('POST Status:', postRes.status);
    const postData = await postRes.json();
    console.log('POST Result:', postData);

    if (!postData.success || !postData.data?.id) {
      throw new Error('Failed to create email in Supabase');
    }

    const createdId = postData.data.id;
    console.log('\n2. Testing GET http://localhost:3000/api/emails ...');
    const getRes = await fetch('http://localhost:3000/api/emails');
    const getData = await getRes.json();
    console.log('GET Count:', getData.count);
    const found = getData.data?.find((e) => e.id === createdId);
    console.log('Found newly inserted email in Supabase:', Boolean(found));
    console.log('Email Details from Supabase:', {
      id: found?.id,
      sender: found?.sender,
      subject: found?.subject,
      user: found?.user?.name,
      analysis: found?.analysisResults?.[0]
    });

    console.log(`\n3. Testing GET http://localhost:3000/api/emails/${createdId} ...`);
    const singleRes = await fetch(`http://localhost:3000/api/emails/${createdId}`);
    const singleData = await singleRes.json();
    console.log('Single GET Status:', singleRes.status);
    console.log('Single GET Subject:', singleData.data?.subject);
    console.log('Single GET RiskScore:', singleData.data?.analysisResults?.[0]?.riskScore);

    console.log('\n>>> ALL SUPABASE DYNAMIC EMAIL API TESTS PASSED! <<<');
  } catch (err) {
    console.error('API Test Error:', err.message);
    process.exit(1);
  }
}

testApi();
